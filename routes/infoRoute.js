import express from "express";
import { assignSeo, buildInfoPageSeo } from "../utils/seo.js";

const router = express.Router();

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
