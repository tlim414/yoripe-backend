import "./env.js"
import express from "express"
import cors from "cors"
import { prisma } from "./lib/prisma.js"
import { clerkMiddleware } from "@clerk/express"

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {

  res.json({
    message: "Yoripe API running",
  });

});

/**
 *------------------------------- CREATE -------------------------------
 */

/**
 * Endpoint for creating a new recipe
 * 
 * @param
 * @return
 */
app.post("/recipes", async (req, res) => {
  try {
    // Parse required params from request body
    const { title, description, instructions, ingredients } = req.body;

    const newRecipe = await prisma.recipe.create({
      data: {
        title,
        description,
        instructions,
        ingredients: {
          create: ingredients,
        },
      },
      include: {
        ingredients: true,
      },
    });
    // Log recipe created
    console.log(`Recipe Added: ${newRecipe}`);

    // 201 response with new recipe
    res.status(201).json({
      message: "Created new recipe",
      newRecipe,
    });
  } catch (error) {
    // Log error
    console.log(error);

    // 500 Error
    res.status(500).json({
      error: "Failed to create recipe",
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
app.get("/recipes", async (req, res) => {
  const { search, title, ingredient } = req.query;

  const whereAnd: any[] = [];

  if (search) {
    whereAnd.push({
      OR: [
        {
          title: {
            contains: search as string,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search as string,
            mode: "insensitive",
          },
        },
        {
          ingredients: {
            some: {
              name: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  if (title) {
    whereAnd.push({
      title: {
        contains: title as string,
        mode: "insensitive",
      },
    });
  }

  if (ingredient) {
    whereAnd.push({
      ingredients: {
        some: {
          name: {
            contains: ingredient as string,
            mode: "insensitive",
          },
        },
      },
    })
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
        createdAt: "desc",
      },
      where: whereAnd.length ? { AND: whereAnd } : undefined,
    });
    console.log({ msg: "Retrieved all recipes", recipes });

    // 200 response and return recipes
    res.status(200).json(recipes);

  } catch (error) {
    // Log Error
    console.log(error);

    // 500 Error
    res.status(500).json({
      error: "Failed to retrieve recipes",
    });
  }
});

/**
 * Endpoint for retreiving detail info of a recipe
 * 
 * @param
 * @returns
 */
app.get("/recipes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        ingredients: true,
      },
    });

    console.log({ msg: `Retreived recipe ${id}`, recipe });

    res.status(200).json(recipe);
  } catch (error) {
    console.log(`Failed to retrieve recipe ${id}`);

    res.status(500).json({
      error: `Failed to retrieve recipe ${id}`,
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
app.patch("/recipes/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, instructions } = req.body;

  try {
    const updatedRecipe = await prisma.recipe.update({
      where: {
        id: id,
      },
      data: {
        title,
        description,
        instructions,
      },
      include: {
        ingredients: true,
      },
    });

    console.log(`Updated recipe ${id}`);

    res.status(200).json({
      message: `Updated recipe ${id}`,
      updatedRecipe,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: `Failed to update recipe ${id}`,
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
app.delete("/recipes/:id", async (req, res) => {
  const { id } = req.params;

  try {

    const deletedRecipe = await prisma.recipe.delete({
      where: {
        id: id
      },
    });

    console.log(`Deleted recipe ${id}`);

    // 200 to return deleted recipe
    res.status(200).json({
      message: `Successfully deleted recipe ${id}`,
      deletedRecipe,
    })
  } catch (error) {
    // Log error
    console.log(error);

    // 500 error
    res.status(500).json({
      error: `Failed to delete recipe ${id}`,
    });
  }
});


/**
 * RUN BACKEND
 */

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);
  console.log(`Databse URL: ${process.env.DATABASE_URL}`)

});