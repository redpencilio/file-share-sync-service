import { app, sparqlEscapeUri, query, errorHandler } from 'mu';
import path from 'path';

// Environment, constants with defaults
const SHARE_FOLDER = process.env.SHARE_FOLDER || '/share/';
const ALLOW_SUPER_CONSUMER = process.env.ALLOW_SUPER_CONSUMER == 'true' ? true : false;
const ALLOWED_ACCOUNTS = (process.env.ALLOWED_ACCOUNTS || 'http://services.lblod.info/diff-consumer/account').split(',');

app.get('/download', async (req, res) => {
  const puri = req.query.uri;
  const name = req.query.name;
  const sessionUri = req.get('mu-session-id');

  if (puri) {
    const hasAccess = await hasSuperAccess(sessionUri) || await hasAccessToFile(puri);

    if (hasAccess) {
      const filepath = path.normalize(puri.replace('share://', SHARE_FOLDER));

      res.download(filepath, name, (err) => {
        if (err) {
          console.error(err);
          res.status(404).end();
        }
        else
          console.log(`Sent file ${filepath} with name ${name}`);
      });
    } else {
      res.status(400).send({ error: 'Invalid credentials' });
    }
  } else {
    res.status(400).send({ error: 'No valid URI found as parameter to the URL. Please try a URL like /download?uri=share://foo' });
  }
});

app.use(errorHandler);

async function hasSuperAccess(sessionUri) {
  if (ALLOW_SUPER_CONSUMER && sessionUri) {
    const result = await query(`
      PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>

      ASK {
        VALUES ?account {
          ${ALLOWED_ACCOUNTS.map(a => sparqlEscapeUri(a)).join('\n')}
        }
        GRAPH <http://mu.semte.ch/graphs/diff-producer/login> {
          ${sparqlEscapeUri(sessionUri)} muAccount:account ?account.
        }
      }
    `, { sudo: true });

    return result.boolean;
  } else {
    return false;
  }
}

async function hasAccessToFile( puri ) {
  const result = await query(`
    ASK {
      ${sparqlEscapeUri(puri)} a <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject>.
    }
  `);
  return result.boolean;
}
