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
