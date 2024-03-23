const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());

const dataFolderPath = path.join(__dirname, "../public", "data", "output");

app.get("/api/data/:id?", (req, res) => {
  const id = req.params.id;
  let data = [];

  fs.readdir(dataFolderPath, (err, files) => {
    if (err) {
      console.error("Error reading data folder:", err);
      return res.status(500).send("Internal Server Error");
    }

    let data = [];
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const filePath = path.join(dataFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(fileData);

        if (!id || jsonData.matchId === id) {
          data.push(jsonData);
        }
      }
    });

    res.json(data);
  });
});

const server = app.listen(3000, () => {
  console.log("Server running on port 3000");
});

fs.watch(dataFolderPath, (eventType, filename) => {
  console.log(`File ${filename} has been ${eventType}`);

  // Perform actions when files are updated or added
  // For example, you can update the data being served by the API
});
