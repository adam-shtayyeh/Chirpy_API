import express, { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError} from "./errors.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "./config.js";
import {createUser, deleteAllUsers, getUserByEmail, updateUser, upgradeUserToChirpyRed} from "./db/queries/users.js";
import {createChirp, getChirps, getChirpById, deleteChirp} from "./db/queries/chirps.js";
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  getBearerToken,
  validateJWT,
  makeRefreshToken,
  getAPIKey
} from "./auth.js";

import {createRefreshToken, getUserFromRefreshToken, revokeRefreshToken} from "./db/queries/refreshTokens.js";


const migrationClient = postgres(config.db.url, {
  max: 1,
});

await migrate(
  drizzle(migrationClient),
  config.db.migrationConfig
);

const app = express();

app.use(express.json());

const PORT = 8080;

function handlerReadiness(req: Request, res: Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
}



function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      console.log(
          `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`
      );
    }
  });

  next();
}



function middlewareMetricsInc(
  req: Request,
  res: Response,
  next: NextFunction
) {
  config.api.fileserverHits++;
  next();
}



function handlerMetrics(req: Request, res: Response) {
  res.set("Content-Type", "text/html; charset=utf-8");

  res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>
`);
}



async function handlerReset(req: Request, res: Response) {

  if (config.api.platform !== "dev") {
    res.status(403).json({
      error: "Forbidden",
    });
    return;
  }

  await deleteAllUsers();

  config.api.fileserverHits = 0;

  res.status(200).send("Reset");
}



function handlerValidateChirp(req: Request, res: Response) {
  const Body = req.body.body;

  if (typeof Body !== "string"){
    res.status(400).send({
      error:"Invalid request",
    });
    return;
  }

  if (Body.length > 140) {
  throw new BadRequestError(
      "Chirp is too long. Max length is 140"
);  }

  const profWords=["kerfuffle","Sharbert","fornax"]

  let cleanedBody = Body;

  for (const word of profWords){
    const regex = new RegExp(`\\b${word}\\b`,"gi");
    cleanedBody = cleanedBody.replace(regex,"****");
  }

  res.status(200).send({
    cleanedBody,
  });
}


async function handlerGetChirps(
  req: Request,
  res: Response
) {

  const authorId = req.query.authorId as string | undefined;

  const sort = req.query.sort as string | undefined;


  let chirps = await getChirps(authorId);


  if (sort === "desc") {

    chirps.sort(
      (a,b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  } else {


    chirps.sort(
      (a,b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

  }


  res.status(200).json(chirps);

}

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof BadRequestError) {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: err.message,
    });
    return;
  }

    console.log(err);

  res.status(500).json({
    error: "Something went wrong on our end",
  });
}

async function handlerGetChirpById(
  req: Request,
  res: Response
) {

  const chirpId = req.params.chirpId as string;

  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    res.status(404).json({
      error: "Chirp not found"
    });
    return;
  }

  res.status(200).json(chirp);
}


async function handlerUpdateUser(
  req: Request,
  res: Response
) {
  try {
    const token = getBearerToken(req);

    const userId = validateJWT(
      token,
      config.jwtSecret
    );

    const { email, password } = req.body;

    const hashedPassword = await hashPassword(password);

    const user = await updateUser(
      userId,
      email,
      hashedPassword
    );

    res.status(200).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  } catch (err) {
    res.status(401).json({
      error: "Unauthorized",
    });
  }
}


async function handlerLogin(
  req: Request,
  res: Response
) {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user) {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }

  const valid = await checkPasswordHash(
    password,
    user.hashedPassword
  );

  if (!valid) {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }



  const token = makeJWT(
    user.id,
    3600,
    config.jwtSecret
  );



  const refreshToken = makeRefreshToken();



  const expiresAt = new Date(
    Date.now() + 60 * 24 * 60 * 60 * 1000
  );


  await createRefreshToken(
    refreshToken,
    user.id,
    expiresAt
  );


  res.status(200).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    token,
    refreshToken,
    isChirpyRed:user.isChirpyRed,
  });
}


async function handlerDeleteChirp(
  req: Request,
  res: Response
) {
  const token = getBearerToken(req);

  const userId = validateJWT(
    token,
    config.jwtSecret
  );

  const chirpId = req.params.chirpId as string;

  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    res.status(404).json({
      error: "Chirp not found",
    });
    return;
  }

  if (chirp.userId !== userId) {
    res.status(403).json({
      error: "Forbidden",
    });
    return;
  }

  await deleteChirp(chirpId);

  res.sendStatus(204);
}


async function handlerUpgradeChirpyToRed(
  req: Request,
  res: Response
) {


  let apiKey: string;

  try {
    apiKey = getAPIKey(req);
  } catch {
    res.status(401).json({
      error: "Unauthorized"
    });
    return;
  }


  if (apiKey !== config.api.polkaKey) {
    res.status(401).json({
      error: "Unauthorized"
    });
    return;
  }



  const { event, data } = req.body;


  if (event !== "user.upgraded") {
    res.sendStatus(204);
    return;
  }


  const user = await upgradeUserToChirpyRed(
    data.userId
  );


  if (!user) {
    res.status(404).json({
      error: "User not found"
    });
    return;
  }


  res.sendStatus(204);

}



app.use(express.json());

app.use(middlewareLogResponses);

app.use("/app", middlewareMetricsInc);

app.use("/app", express.static("./src/app"));



app.get("/api/healthz", handlerReadiness);

app.get("/admin/metrics", handlerMetrics);

app.get("/api/chirps", handlerGetChirps);

app.get("/api/chirps/:chirpId", handlerGetChirpById);



app.post("/api/validate_chirp",handlerValidateChirp);

app.post("/admin/reset", handlerReset);

app.post("/api/users", async (req: Request, res: Response) => {
  const hashedPassword = await hashPassword(req.body.password);

  const user = await createUser({
    email: req.body.email,
    hashedPassword,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed:user.isChirpyRed,
  });
});

app.post("/api/chirps", async (req: Request, res: Response) => {

  let userId: string;

  try {
    const token = getBearerToken(req);

    userId = validateJWT(
      token,
      config.jwtSecret
    );

  } catch (error) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }


  const { body } = req.body;


  if (typeof body !== "string" || body.length > 140) {
    res.status(400).json({
      error: "Chirp is too long",
    });
    return;
  }


  const profaneWords = [
    "kerfuffle",
    "sharbert",
    "fornax",
  ];


  let cleanedBody = body;


  for (const word of profaneWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");

    cleanedBody = cleanedBody.replace(
      regex,
      "****"
    );
  }


  const chirp = await createChirp({
    body: cleanedBody,
    userId,
  });


  res.status(201).json(chirp);
});

app.post("/api/login", handlerLogin);

app.post("/api/refresh", async (req: Request, res: Response) => {

  const refreshToken = getBearerToken(req);

  const tokenData = await getUserFromRefreshToken(refreshToken);

  if (!tokenData) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }


  if (
    tokenData.revokedAt ||
    tokenData.expiresAt < new Date()
  ) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }


  const token = makeJWT(
    tokenData.userId,
    3600,
    config.jwtSecret
  );


  res.status(200).json({
    token,
  });
});

app.post("/api/revoke", async (req: Request, res: Response) => {

  const refreshToken = getBearerToken(req);

  await revokeRefreshToken(refreshToken);

  res.status(204).send();

});

app.post("/api/polka/webhooks", handlerUpgradeChirpyToRed);





app.put("/api/users", handlerUpdateUser);




app.delete("/api/chirps/:chirpId", handlerDeleteChirp);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});