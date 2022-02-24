import { Request, Response } from "express";

import { NotFoundError } from "./../errors";

const validateResponse = (req: Request, res: Response) => {
  const data = req.data;
  const status = req.status || 200;

  if (!data) {
    throw new NotFoundError();
  }

  res.status(status).send({ status: 1, errors: [], data: data });
};

export { validateResponse };
