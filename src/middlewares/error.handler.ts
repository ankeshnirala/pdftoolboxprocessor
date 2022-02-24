import { Request, Response, NextFunction } from "express";

import { CustomError } from "../errors/custom.error";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    return res
      .status(err.statusCode)
      .send({ status: 0, errors: err.serializeErrors(), data: [] });
  }

  res.status(400).send({
    status: 0,
    errors: [{ message: err.message }],
    data: [],
  });
};

export { errorHandler };
