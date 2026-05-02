import express from "express";

const router = express.Router();

// Informational Routes
router.get("/help", (req, res) => {
  res.render("info/help.ejs");
});

router.get("/terms", (req, res) => {
  res.render("info/static.ejs", { title: "Terms of Service" });
});

router.get("/privacy", (req, res) => {
  res.render("info/static.ejs", { title: "Privacy Policy" });
});

router.get("/sitemap", (req, res) => {
  res.render("info/static.ejs", { title: "Sitemap" });
});

router.get("/privacy-choices", (req, res) => {
  res.render("info/static.ejs", { title: "Your Privacy Choices" });
});

router.get("/careers", (req, res) => {
  res.render("info/static.ejs", { title: "Careers" });
});

router.get("/hosting", (req, res) => {
  res.render("info/hosting.ejs");
});

export default router;
