import './env.js'; // Import env variables

import express from 'express';
import cors from 'cors';

// Prisma
import { prisma } from './lib/prisma.js';
import { Prisma } from '@prisma/client';
// Clerk Auth
import { clerkMiddleware, getAuth } from '@clerk/express';
// Frontend port default to 5050
const PORT = process.env.PORT || 5050;

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(clerkMiddleware());

// Unauthorized msg
const UNAUTHORIZED = `Unauthorized`;

/**
 * RUN BACKEND
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Databse URL: ${process.env.DATABASE_URL}`);
  console.log(`Clerk Publishable Key: ${process.env.CLERK_PUBLISHABLE_KEY}`);
  console.log(`Clerk Secert Key: ${process.env.CLERK_SECRET_KEY}`);
});

/**
 * Endpoint for landing page
 */
app.get('/', async (req, res) => {
  res.json({
    message: `Yoripe API running`,
  });
});

interface IngredientInput {
  name: string;
  unit: string;
  amount: string | number;
}
/**
 *------------------------------- CREATE -------------------------------
 */

/**
 * Endpoint for creating a new recipe
 *
 * @param
 * @return
 */
app.post('/recipes', async (req, res) => {
  // Authorization check
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: UNAUTHORIZED });
  }

  // Parse required params from request body
  const title = req.body.title as string;
  const description = req.body.description as string;
  const instructions = req.body.instructions as string[];
  const ingredients = req.body.ingredients as IngredientInput[];

  try {
    const newRecipe = await prisma.recipe.create({
      data: {
        userId,
        title,
        description,
        instructions,
        ingredients: {
          create: ingredients.map((ing) => ({
            name: ing.name,
            unit: ing.unit,
            amount: Number(ing.amount),
          })),
        },
      },
      include: {
        ingredients: true,
      },
    });

    const msg = `Created new recipe for user ${userId}`;

    // Log recipe created
    console.log(msg);
    console.log(newRecipe);

    // 201 response with new recipe
    res.status(201).json({
      message: msg,
      newRecipe,
    });
  } catch (error) {
    const errorMsg = `Failed to create recipe for user ${userId}`;

    // Log error
    console.log(errorMsg);
    console.log(error);

    // 500 Error
    res.status(500).json({
      error: errorMsg,
    });
  }
});

/**
 *------------------------------- READ -------------------------------
 */

/**
 * Endpoint for retreiving all recipes summarized filtering by search query to match title or
 * description
 *
 * @param
 * @returns
 */
app.get('/recipes', async (req, res) => {
  // Authorization check
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: UNAUTHORIZED });
  }

  const { q, by } = req.query;
  const searchString = q as string;
  const searchType = by as string;

  // Default filtering by signed in user
  const whereAnd: Prisma.RecipeWhereInput[] = [
    {
      userId,
    },
  ];

  // If general search query, filter by given search string by matching to either title,
  // description or ingredient names
  if (searchString && searchString.trim() !== '') {
    if (searchType === 'title') {
      // Filter by title only
      whereAnd.push({
        title: {
          contains: searchString,
          mode: 'insensitive',
        },
      });
    } else if (searchType === 'ingredient') {
      // Filter by ingredients only
      whereAnd.push({
        ingredients: {
          some: {
            name: {
              contains: searchString,
              mode: 'insensitive',
            },
          },
        },
      });
    } else {
      // Else search by all
      whereAnd.push({
        OR: [
          {
            title: {
              contains: searchString,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchString,
              mode: 'insensitive',
            },
          },
          {
            ingredients: {
              some: {
                name: {
                  contains: searchString,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }
  }

  try {
    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      where: whereAnd.length ? { AND: whereAnd } : undefined,
    });

    const msg = `Retrieved all recipes for user ${userId}`;

    console.log({ msg: msg, recipes });

    // 200 response and return recipes
    res.status(200).json(recipes);
  } catch (error) {
    const errorMsg = `Failed to retrieve recipes for user ${userId}`;

    // Log Error
    console.log(errorMsg);
    console.log(error);

    // 500 Error
    res.status(500).json({
      error: errorMsg,
    });
  }
});

/**
 * Endpoint for retreiving detail info of a recipe
 *
 * @param
 * @returns
 */
app.get('/recipes/:id', async (req, res) => {
  // Authorization check
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: UNAUTHORIZED });
  }

  const { id } = req.params;

  try {
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        ingredients: true,
      },
    });

    const msg = `Retrieved recipe ${id}`;

    console.log({ msg: msg, recipe });

    res.status(200).json(recipe);
  } catch (error) {
    const errorMsg = `Failed to retrieve recipe ${id}`;

    console.log(errorMsg);
    console.log(error);

    res.status(500).json({
      error: errorMsg,
    });
  }
});

/**
 * Endpoint for searching for a recipe by title or description
 */

/**
 *------------------------------- UPDATE -------------------------------
 */

/**
 * Endpoint for updating title, description, or instructions of a recipe
 *
 * @param
 * @returns
 */
app.patch('/recipes/:id', async (req, res) => {
  // Authorization check
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: UNAUTHORIZED });
  }

  const { id } = req.params;
  const title = req.body.title as string;
  const description = req.body.description as string;
  const instructions = req.body.instructions as string[];
  const ingredients = req.body.ingredients as IngredientInput[];

  try {
    const updatedRecipe = await prisma.recipe.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        title,
        description,
        instructions,
        ...(ingredients && {
          ingredients: {
            deleteMany: {},
            create: ingredients.map((ing) => ({
              name: ing.name,
              unit: ing.unit,
              amount: Number(ing.amount),
            })),
          },
        }),
      },
      include: {
        ingredients: true,
      },
    });

    const msg = `Updated recipe ${id}`;
    console.log(msg);

    res.status(200).json({
      message: msg,
      updatedRecipe,
    });
  } catch (error) {
    const errorMsg = `Failed to update recipe ${id}`;

    console.log(errorMsg);
    console.log(error);

    res.status(500).json({
      error: errorMsg,
    });
  }
});

/**
 *------------------------------- DELETE -------------------------------
 */

/**
 * Endpoint for deleting a recipe
 *
 * @param
 * @returns
 */
app.delete('/recipes/:id', async (req, res) => {
  // Authorization check
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: UNAUTHORIZED });
  }
  const { id } = req.params;

  try {
    const deletedRecipe = await prisma.recipe.delete({
      where: {
        id: id,
        userId: userId,
      },
    });
    const msg = `Successfully deleted recipe ${id}`;

    console.log(msg);

    // 200 to return deleted recipe
    res.status(200).json({
      message: msg,
      deletedRecipe,
    });
  } catch (error) {
    const errorMsg = `Failed to delete recipe ${id}`;

    // Log error
    console.log(errorMsg);
    console.log(error);

    // 500 error
    res.status(500).json({
      error: errorMsg,
    });
  }
});
