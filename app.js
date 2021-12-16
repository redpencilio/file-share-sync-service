import { app, sparqlEscapeUri } from "mu";
import { querySudo } from '@lblod/mu-auth-sudo';
import path from "path";

// Environment, constants with defaults
const SHARE_FOLDER = process.env.SHARE_FOLDER || "/share/";

console.log(process.version);

app.get("/download", async (req, res) => {
  // 1. get request info
  const puri = req.query.uri;
  const name = req.query.name;
  const sessionUri = req.get('mu-session-id');

  // 2. verify the trusted consumer is asking the question
  const isDiffConsumer = querySudo(`
    PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>

    ASK {
      GRAPH <http://mu.semte.ch/graphs/diff-producer/login> {
        ${sparqlEscapeUri(sessionUri)} muAccount:account <http://services.lblod.info/diff-consumer/account>.
       }
    }`).boolean;

  // 3. construct a response
  if (!isDiffConsumer) {
    // A. you're not the consumer
    res.send(400).send({ error: "Invalid credentials" });

  } else if (!puri) {
    // B. you didn't supply a file
    res.send(400).send({ error: "No valid URI found as parameter to the URL. Please try a URL like `/download?uri=share://foo`" });

  } else {
    // C. fetch the lot
    const filepath = path.normalize(`${SHARE_FOLDER}/${puri.replace("share://", "")}`);
    res.download(filepath, name, err => {
      if (err) {
        console.error(err);
        res.status(404).end();
      }
      else
        console.log(`Sent file ${filepath} with name ${name}`);
    });
  }
});
