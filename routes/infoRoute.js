import express from "express";

const router = express.Router();

router.get("/help", (req, res) => {
  res.render("info/help.ejs", { pageTitle: "Help Centre", landingActive: "help" });
});

router.get("/terms", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Terms of Service",
    title: "Terms of Service",
    pageKey: "terms",
  });
});

router.get("/privacy", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Privacy Policy",
    title: "Privacy Policy",
    pageKey: "privacy",
  });
});

router.get("/sitemap", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Sitemap",
    title: "Sitemap",
    pageKey: "sitemap",
  });
});

router.get("/privacy-choices", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Your Privacy Choices",
    title: "Your Privacy Choices",
    pageKey: "privacy-choices",
  });
});

router.get("/careers", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Careers",
    title: "Careers",
    pageKey: "careers",
  });
});

router.get("/hosting", (req, res) => {
  res.render("info/hosting.ejs", { pageTitle: "Hosting", landingActive: "host" });
});

export default router;
