import { app, sparqlEscapeUri, query, errorHandler } from "mu";
import { querySudo } from '@lblod/mu-auth-sudo';
import path from "path";

// Environment, constants with defaults
const SHARE_FOLDER = process.env.SHARE_FOLDER || "/share/";
const DATA_FOLDER = "/data/";
const ALLOW_SUPER_CONSUMER = process.env.ALLOW_SUPER_CONSUMER == "true" ? true : false;
const ALLOWED_ACCOUNTS = process.env.ALLOWED_ACCOUNTS || 'http://services.lblod.info/diff-consumer/account';

app.get("/download", async (req, res) => {
  // Get request info
  const puri = req.query.uri;
  const name = req.query.name;
  const sessionUri = req.get('mu-session-id');

  // 1. Validate request
  if (!puri) {
    res.status(400).send({ error: "No valid URI found as parameter to the URL. Please try a URL like `/download?uri=share://foo`" });
  }
  else {

    // 2. Validate access:
    //    A. if super-consumer, check session in db
    //    B. or, check normal authorization scheme provided by mu-auth
    let hasAccess = await isValidSuperConsumer(sessionUri) || await hasAccessToFile(puri);
    console.log("ACCESS?", hasAccess);
    hasAccess = true;
    // 3. Returning response
    if (!hasAccess) {
      // A. You're not the consumer
      res.status(400).send({ error: "Invalid credentials" });
    }
    else {
      // B. Authorization is fine: we try to return the file.
      let filepath = "";
      if(puri.startsWith('share')){
        filepath = path.normalize(`${SHARE_FOLDER}/${puri.replace("share://", "")}`);
        console.log('accessed a file in share-------->');
      } else{
        filepath = path.normalize(`${DATA_FOLDER}/${puri.replace("data://", "")}`);
        console.log('accessed a file in data--------->');
      }


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
    const accounts = ALLOWED_ACCOUNTS.split(',').map(a => sparqlEscapeUri(a));
    const queryStr = `
      PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>

      ASK {
        VALUES ?account {
          ${accounts.join('\n')}
        }
        GRAPH <http://mu.semte.ch/graphs/diff-producer/login> {
          ${sparqlEscapeUri(sessionUri)} muAccount:account ?account.
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
