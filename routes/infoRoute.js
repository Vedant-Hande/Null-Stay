import express from "express";
import { assignSeo, buildInfoPageSeo } from "../utils/seo.js";
import wrapAsync from "../utils/wrapAsync.js";
import { supportContactSchema } from "../schemas/support.js";
import {
  sendSupportEmails,
  getSupportInboxDisplay,
  isMailConfigured,
} from "../utils/supportEmail.js";
import { FLASH_KEYS, FLASH_MESSAGES } from "../utils/constants.js";
import { createLogger } from "../config/logger.js";

const supportLog = createLogger("support");

const router = express.Router();

function defaultContactForm(req) {
  return {
    name: req.user?.username || "",
    email: req.user?.email || "",
    topic: "general",
    bookingRef: "",
    subject: "",
    message: "",
  };
}

function renderContact(req, res, { form, pageTitle = "Contact Support" } = {}) {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle,
      metaDescription:
        "Contact NullStay support for help with bookings, payments, hosting, and your account.",
      path: "/contact",
    }),
  );
  res.render("info/contact.ejs", {
    pageTitle,
    landingActive: "help",
    form: form || defaultContactForm(req),
    supportInbox: getSupportInboxDisplay(),
    mailConfigured: isMailConfigured(),
  });
}

router.get("/contact", (req, res) => {
  renderContact(req, res);
});

router.post(
  "/contact",
  wrapAsync(async (req, res) => {
    const { error, value } = supportContactSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const msg = error.details.map((el) => el.message).join(", ");
      req.flash(FLASH_KEYS.ERROR, msg);
      return renderContact(req, res, { form: { ...defaultContactForm(req), ...req.body } });
    }

    try {
      const result = await sendSupportEmails(value);
      if (result?.skipped) {
        supportLog.warn("Contact form (mail not configured)", {
          email: value.email,
          topic: value.topic,
        });
        req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.SUPPORT.NOT_CONFIGURED);
      } else {
        req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.SUPPORT.SENT);
      }
      return res.redirect("/contact");
    } catch (err) {
      supportLog.error("Contact form failed", err);
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.SUPPORT.SEND_FAILED);
      return renderContact(req, res, { form: value });
    }
  }),
);

router.get("/help", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Help Centre",
      metaDescription:
        "Get help with bookings, hosting, payments, and your NullStay account.",
      path: "/help",
    }),
  );
  res.render("info/help.ejs", { pageTitle: "Help Centre", landingActive: "help" });
});

router.get("/terms", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Terms of Service",
      metaDescription: "Read the NullStay terms of service for guests and hosts.",
      path: "/terms",
    }),
  );
  res.render("info/static.ejs", {
    pageTitle: "Terms of Service",
    title: "Terms of Service",
    pageKey: "terms",
  });
});

router.get("/privacy", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Privacy Policy",
      metaDescription: "How NullStay collects, uses, and protects your personal data.",
      path: "/privacy",
    }),
  );
  res.render("info/static.ejs", {
    pageTitle: "Privacy Policy",
    title: "Privacy Policy",
    pageKey: "privacy",
  });
});

router.get("/sitemap", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Sitemap",
      metaDescription: "Browse all main pages on NullStay — explore, host, and account links.",
      path: "/sitemap",
    }),
  );
  res.render("info/static.ejs", {
    pageTitle: "Sitemap",
    title: "Sitemap",
    pageKey: "sitemap",
  });
});

router.get("/privacy-choices", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Your Privacy Choices",
      metaDescription: "Manage your privacy preferences on NullStay.",
      path: "/privacy-choices",
    }),
  );
  res.render("info/static.ejs", {
    pageTitle: "Your Privacy Choices",
    title: "Your Privacy Choices",
    pageKey: "privacy-choices",
  });
});

router.get("/careers", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Careers",
      metaDescription: "Join the NullStay team — careers and open roles.",
      path: "/careers",
    }),
  );
  res.render("info/static.ejs", {
    pageTitle: "Careers",
    title: "Careers",
    pageKey: "careers",
  });
});

router.get("/hosting", (req, res) => {
  assignSeo(
    res,
    buildInfoPageSeo({
      pageTitle: "Hosting",
      metaDescription:
        "Learn how to list your property on NullStay and start hosting guests.",
      path: "/hosting",
    }),
  );
  res.render("info/hosting.ejs", { pageTitle: "Hosting", landingActive: "host" });
});

export default router;
