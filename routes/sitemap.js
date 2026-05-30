app.get("/sitemap.xml", async (req, res) => {
  try {
    const listings = await Listing.find({});

    const urls = listings
      .map(
        (listing) => `
        <url>
          <loc>https://null-stay.onrender.com/listings/${listing._id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `,
      )
      .join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://null-stay.onrender.com/</loc>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://null-stay.onrender.com/listings</loc>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
        ${urls}
      </urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    res.status(500).send("Error generating sitemap");
  }
});
