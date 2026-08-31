// Оборачивает async route-handler так, чтобы любая ошибка (в т.ч. из SQLite)
// уходила в next(err) и попадала в общий JSON error-handler, а не рушила
// запрос "молча" HTML-страницей, которую фронтенд не может разобрать.
export function ah(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
