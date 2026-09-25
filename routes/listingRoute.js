import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { validateListing } from "../middleware/validationMiddleware.js";
import listings from "../models/listing.js";
import { FLASH_KEYS, FLASH_MESSAGES, BOOKING_FLASH } from "../utils/constants.js";
import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import { isLoggedIn, isOwner } from "../middleware/authMiddleware.js";
import { listingUpload } from "../middleware/uploadMiddleware.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import {
  destroyCloudinaryImage,
  destroyCloudinaryImages,
  destroyListingImages,
  normalizeRemoveIds,
  uploadFilesToCloudinary,
} from "../utils/cloudinaryImages.js";
import { LISTING_MAX_GALLERY_IMAGES } from "../utils/constants.js";
import ExpressError from "../utils/ExpressError.js";
import {
  calculateBookingTotals,
  getBookedDateRanges,
  getListingFees,
  hasDateOverlap,
  rangesToDisabledDates,
  validateBookingDates,
} from "../utils/bookingUtils.js";
import { geocodeLocation } from "../utils/geocodeLocation.js";
import {
  getRazorpayKeyId,
  isRazorpayConfigured,
  isRazorpayLiveMode,
} from "../config/razorpay.js";
import { buildListingFilter } from "../utils/listingSearch.js";
import { LISTINGS_PER_PAGE } from "../utils/pagination.js";
import {
  getCachedListingSearch,
  getCachedListingDetail,
  invalidateListingsCache,
  invalidateListingDetail,
} from "../utils/listingCache.js";
import { getWishlistedIdsForUser } from "../utils/wishlistIds.js";
import {
  notifyAfterListingCreated,
  notifyAfterListingDeleted,
  notifyAfterListingUpdated,
} from "../utils/activityNotifications.js";
import { getReviewFormState } from "../utils/reviewEligibility.js";
import calculateAvgRating from "../utils/calculateAvgRating.js";
import {
  assignSeo,
  buildListingDetailSeo,
  buildListingsIndexSeo,
  buildPrivatePageSeo,
} from "../utils/seo.js";
import Wishlist from "../models/wishlist.js";

async function uploadCoverImage(file) {
  const result = await uploadToCloudinary(file.buffer);
  return { url: result.secure_url, filename: result.public_id };
}

async function applyGalleryUpdates(listing, req) {
  const removeIds = normalizeRemoveIds(req.body.removeSubImages);
  let gallery = [...(listing.images || [])];

  await destroyCloudinaryImages(removeIds);
  gallery = gallery.filter((img) => !removeIds.includes(img.filename));

  const subFiles = req.files?.subImages || [];
  const slotsLeft = LISTING_MAX_GALLERY_IMAGES - gallery.length;

  if (subFiles.length > slotsLeft) {
    throw new ExpressError(
      400,
      `You can only have ${LISTING_MAX_GALLERY_IMAGES} gallery photos in total.`,
    );
  }

  if (subFiles.length) {
    const uploaded = await uploadFilesToCloudinary(subFiles);
    gallery = [...gallery, ...uploaded];
  }

  listing.images = gallery;
}

const router = express.Router();

router.get(
  "/",
  wrapAsync(async (req, res, next) => {
    if (req.query.page && parseInt(req.query.page, 10) > 1) {
      const q = { ...req.query };
      delete q.page;
      const qs = new URLSearchParams(q).toString();
      return res.redirect("/listings" + (qs ? `?${qs}` : ""));
    }

    const filter = buildListingFilter(req.query);
    const { pagination: scrollPagination, rows: allListing } =
      await getCachedListingSearch(listings, {
        filter,
        page: 1,
        perPage: LISTINGS_PER_PAGE,
      });

    res.locals.searchQuery = req.query;

    const wishlistedIds = await getWishlistedIdsForUser(req.user?._id);

    assignSeo(res, buildListingsIndexSeo(req.query));
    res.render("listings/listings.ejs", {
      allListing,
      searchQuery: req.query,
      wishlistedIds,
      scrollPagination,
    });
  }),
);

// new listing route
router.get("/new", isLoggedIn, (req, res) => {
  assignSeo(res, buildPrivatePageSeo("New listing"));
  res.render("listings/newListing.ejs");
});

// Create listing route
router.post(
  "/",
  isLoggedIn,
  listingUpload,
  validateListing,
  wrapAsync(async (req, res) => {
    const mainFile = req.files?.image?.[0];

    if (!mainFile) {
      req.flash(FLASH_KEYS.ERROR, "Please upload a cover photo.");
      return res.redirect("/listings/new");
    }

    const result = await uploadToCloudinary(mainFile.buffer);
    const newListing = new listings(req.body.listing);
    newListing.image = { url: result.secure_url, filename: result.public_id };
    newListing.owner = req.user._id;
    newListing.images = [];

    await applyGalleryUpdates(newListing, req);
    newListing.markModified("images");
    newListing.markModified("image");
    await newListing.save();

    await notifyAfterListingCreated({
      app: req.app,
      listing: newListing,
      hostUser: req.user,
    });

    invalidateListingsCache();

    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.CREATE_SUCCESS);
    res.redirect("/listings");
  }),
);

// edit Listing route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listingToEdit = await listings.findById(id);
    assignSeo(res, buildPrivatePageSeo("Edit listing"));
    res.render("listings/editListing.ejs", { listingToEdit });
  }),
);

// update listing route
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  listingUpload,
  validateListing,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }

    const listingData = { ...req.body.listing };
    delete listingData.image;
    delete listingData.images;
    Object.assign(listing, listingData);

    const mainFile = req.files?.image?.[0];

    const coverUpdate = mainFile
      ? (async () => {
          await destroyCloudinaryImage(listing.image?.filename);
          listing.image = await uploadCoverImage(mainFile);
        })()
      : Promise.resolve();

    await Promise.all([coverUpdate, applyGalleryUpdates(listing, req)]);

    listing.markModified("images");
    if (mainFile) listing.markModified("image");
    await listing.save();

    await notifyAfterListingUpdated({ app: req.app, listing });

    invalidateListingDetail(id);

    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.UPDATE_SUCCESS);
    res.redirect(`/listings/${id}`);
  }),
);

// delete listing route
router.delete(
  "/:id/delete",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }

    const affectedBookings = await Booking.find({
      listing: id,
      status: {
        $in: [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED],
      },
    });

    await notifyAfterListingDeleted({
      app: req.app,
      listing,
      bookings: affectedBookings,
    });

    await destroyListingImages(listing);
    await Booking.deleteMany({ listing: id });
    await listings.findByIdAndDelete(id);
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.DELETE_SUCCESS);
    res.redirect("/listings");
  }),
);

router.get(
  "/:id/booked-dates",
  wrapAsync(async (req, res) => {
    const ranges = await getBookedDateRanges(req.params.id);
    const disabled = rangesToDisabledDates(ranges);
    res.json({ ranges, disabled });
  }),
);

router.get(
  "/:id/checkout",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests: guestsStr } = req.query;

    const listing = await listings.findById(id).populate("owner");
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }

    const ownerId = listing.owner?._id ?? listing.owner;
    if (ownerId && ownerId.equals(req.user._id)) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.OWN_LISTING);
      return res.redirect(`/listings/${id}`);
    }

    if (!checkIn || !checkOut || !guestsStr) {
      req.flash(FLASH_KEYS.ERROR, "Please select check-in, check-out, and guests.");
      return res.redirect(`/listings/${id}`);
    }

    const guests = parseInt(guestsStr, 10);
    if (Number.isNaN(guests) || guests < 1) {
      req.flash(FLASH_KEYS.ERROR, "Invalid guest count.");
      return res.redirect(`/listings/${id}`);
    }

    if (guests > listing.guests) {
      req.flash(
        FLASH_KEYS.ERROR,
        `This listing allows up to ${listing.guests} guests.`,
      );
      return res.redirect(`/listings/${id}`);
    }

    const dateResult = validateBookingDates(checkIn, checkOut);
    if (dateResult.error) {
      req.flash(FLASH_KEYS.ERROR, dateResult.error);
      return res.redirect(`/listings/${id}`);
    }

    if (
      await hasDateOverlap(
        listing._id,
        dateResult.checkIn,
        dateResult.checkOut,
      )
    ) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.DATES_UNAVAILABLE);
      return res.redirect(`/listings/${id}`);
    }

    const totals = calculateBookingTotals(listing, dateResult.nights);
    const fees = getListingFees(listing);

    assignSeo(res, buildPrivatePageSeo("Checkout"));
    res.render("bookings/checkout.ejs", {
      listing,
      checkIn,
      checkOut,
      guests,
      totals,
      instantBook: listing.instantBook !== false,
      razorpayEnabled: isRazorpayConfigured(),
      razorpayLiveMode: isRazorpayLiveMode(),
      razorpayKeyId: getRazorpayKeyId(),
    });
  }),
);

// Show route
router.get(
  "/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const { listing } = await getCachedListingDetail(listings, id);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }

    const reviews = listing.reviews || [];
    const avgRating = calculateAvgRating(reviews);
    const fees = getListingFees(listing);
    const isOwner =
      req.user &&
      listing.owner &&
      (listing.owner._id?.equals(req.user._id) ||
        listing.owner.toString() === req.user._id.toString());

    let isWishlisted = false;
    if (req.user) {
      isWishlisted = Boolean(
        await Wishlist.findOne({ user: req.user._id, listing: listing._id }),
      );
    }

    const listingForView = { ...listing, reviews };
    const { canLeaveReview, reason: reviewBlockReason } = getReviewFormState(
      listingForView,
      req.user,
    );

    const mapCoords = await geocodeLocation(
      listing.location,
      listing.country,
    );

    assignSeo(res, buildListingDetailSeo(listingForView, avgRating));
    res.render("listings/show.ejs", {
      listing: listingForView,
      avgRating,
      fees,
      mapCoords,
      isOwner,
      isWishlisted,
      canLeaveReview,
      reviewBlockReason,
    });
  }),
);

export default router;
