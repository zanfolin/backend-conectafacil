import { ZodError } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };
      const validated = schema.parse(data);
      req.validated = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Dados de entrada inválidos',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      throw err;
    }
  };
}