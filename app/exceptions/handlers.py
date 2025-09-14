from flask import jsonify
from app.exceptions.errors import AppError

class AppExceptionHandler:

    @staticmethod
    def handle_app_error(err: AppError):
        return jsonify(err.to_payload()), err.http_status
    #
    @staticmethod
    def handle_unexpected(e):
        return jsonify({"message": "Unexpected error"}), 500
    #
    @classmethod
    def init_app(cls, app):
        app.register_error_handler(AppError,cls.handle_app_error)
        #
        def _log_and_handle_unexpected(e):
            app.logger.exception(e)
            return cls.handle_unexpected(e)
        app.register_error_handler(Exception, _log_and_handle_unexpected)