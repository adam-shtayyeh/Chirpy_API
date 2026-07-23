import { db } from "../index.js";
import { chirps, NewChirp } from "../schema.js";
import { asc, eq} from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {

  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();

  return result;
}


export async function getChirps(authorId?: string) {


  if(authorId){

    const result = await db
      .select()
      .from(chirps)
      .where(
        eq(chirps.userId, authorId)
      );


    return result;
  }


  const result = await db
    .select()
    .from(chirps);


  return result;

}


export async function getChirpById(id: string) {
  const [chirp] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, id));

  return chirp;
}

export async function deleteChirp(id: string) {
  const [chirp] = await db
    .delete(chirps)
    .where(eq(chirps.id, id))
    .returning();

  return chirp;
}