// see https://github.com/mu-semtech/mu-javascript-template for more info
import fs   from "fs";
import path from "path";
import { Buffer }    from "buffer";
import { app }       from "mu";
import { querySudo } from '@lblod/mu-auth-sudo';
import * as mu      from "mu";
import * as express from "express";

// Environment, constants with defaults
const SHARE_FOLDER = process.env.SHARE_FOLDER || "/share/";
const FILES_GRAPH  = process.env.FILES_GRAPH  || "http://mu.semte.ch/files/";

console.log(process.version);

//GET /file/share%3A%2F%2F6148723409875
//Returns metadata
app.use("/file/:puri", express.json());
app.get("/file/:puri", async (req, res) => {
  //URI encoded puri is atomatically decoded by express, {} if no parameter found
  const puri = req.params.puri;

  //If no puri given → nothing to do
  if (typeof puri === "object")
    res.send(400).send({ error: "No valid URI found as parameter to the URL. Please try a URL like `/file/:puri` where `:puri` is a URL encoded string." });

  const queryString = `
    PREFIX mu:  <http://mu.semte.ch/vocabularies/core/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
    PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
    PREFIX db:  <http://dbpedia.org/ontology/>

    SELECT ?uri ?muuuid ?name ?format ?size ?extension
    WHERE {
      GRAPH ${mu.sparqlEscapeUri(FILES_GRAPH)} {
        ?uri mu:uuid          ?muuuid ;
             nfo:fileName     ?name ;
             dct:format       ?format ;
             db:fileExtension ?extension ;
             nfo:fileSize     ?size .
        ${mu.sparqlEscapeUri(puri)} nie:dataSource ?uri .
      }
    }
  `;
  
  const results = await querySudo(queryString);
  if (results.results.bindings && results.results.bindings.length > 0) {
    const binding = results.results.bindings[0];
    const metadata = {
      data: {
        type: 'files',
        id: binding.muuuid.value,
        attributes: {
          name: binding.name.value,
          format: binding.format.value,
          size: binding.size.value,
          extension: binding.extension.value
        }
      },
      links: {
        self: req.originalUrl
      }
    }
    res.status(200).send(metadata);
  }
  else {
    res.status(404).send({ error: `No metadata found for file with physical file URI "${puri}".` });
  }
});

//GET /file/share%3A%2F%2F6148723409875/download?name=test.pdf
//Returns the specified file with given name
app.use("/file/:puri/download*", express.json());
app.get("/file/:puri/download", async (req, res) => {
  const puri = req.params.puri;
  const name = req.query.name;
  
  if (typeof puri === "object")
    res.send(400).send({ error: "No valid URI found as parameter to the URL. Please try a URL like `/file/:puri` where `:puri` is a URL encoded string." });

  if (typeof name === "object")
    name = undefined;

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
