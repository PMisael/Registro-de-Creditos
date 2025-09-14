class AppError(Exception):
    http_status = 400
    message     = "Aplicacion error"
    #
    def to_payload(self):
        return {"message": self.message}
#
class ValidationError(AppError):
    http_status = 400
    message     = "Validation error"
    #
    def __init__(self, errors: dict):
        super().__init__(self.message)
        self.errors = errors
    #
    def to_payload(self):
        return {"message": self.message, "errors": self.errors}
#
class NotFoundError(AppError):
    http_status = 404
    message     = "No encontrado"
#
class InternalError(AppError):
    http_status = 500
    message     = "Internal server error"