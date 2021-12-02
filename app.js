import { app } from "mu";
import path from "path";

// Environment, constants with defaults
const SHARE_FOLDER = process.env.SHARE_FOLDER || "/share/";

console.log(process.version);

app.get("/download", async (req, res) => {
  const puri = req.query.uri;
  const name = req.query.name;

  if (!puri)
    res.send(400).send({ error: "No valid URI found as parameter to the URL. Please try a URL like `/download?uri=share://foo`" });

  const filepath = path.normalize(`${SHARE_FOLDER}/${puri.replace("share://", "")}`);
  res.download(filepath, name, err => {
    if (err) {
      console.error(err);
      res.status(404).end();
    }
    else
      console.log(`Sent file ${filepath} with name ${name}`);
  });

});
