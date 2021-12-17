import { app, sparqlEscapeUri, query, errorHandler } from "mu";
import { querySudo } from '@lblod/mu-auth-sudo';
import path from "path";

// Environment, constants with defaults
const SHARE_FOLDER = process.env.SHARE_FOLDER || "/share/";
const ALLOW_SUPER_CONSUMER = process.env.ALLOW_SUPER_CONSUMER == "true" ? true : false;

app.get("/download", async (req, res) => {
  // Get request info
  const puri = req.query.uri;
  const name = req.query.name;
  const sessionUri = req.get('mu-session-id');

  // Validate request
  if (!puri) {
    res.send(400).send({ error: "No valid URI found as parameter to the URL. Please try a URL like `/download?uri=share://foo`" });
  }
  else {

    // Validate access:
    //   - if super-consumer, check session in db
    //   - else fall back to normal authorization scheme provided by mu-auth
    const hasAccess = await isValidSuperConsumer(sessionUri) || await hasAccessToFile(puri);

    if (!hasAccess) {
      // You're not the consumer
      res.send(400).send({ error: "Invalid credentials" });
    }
    else {
      // All fine: we try to return the file.
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
  }
});

app.use(errorHandler);

async function isValidSuperConsumer( sessionUri ) {
  if(!ALLOW_SUPER_CONSUMER) {
    return false;
  }
  else if(!sessionUri) {
    return false;
  }
  else {
    const queryStr = `
      PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>

      ASK {
        GRAPH <http://mu.semte.ch/graphs/diff-producer/login> {
          ${sparqlEscapeUri(sessionUri)} muAccount:account <http://services.lblod.info/diff-consumer/account>.
         }
      }
    `;
    const result = await querySudo(queryStr);

    return result.boolean;
  };
}

async function hasAccessToFile( puri ) {
  const queryStr = `
    ASK {
      ${sparqlEscapeUri(puri)} a <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject>.
    }
  `;
  const result = await query(queryStr);
  return result.boolean;
}
