import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()
    const isProd = process.env.NODE_ENV === 'production'

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        response.status(statusCode).json({
          statusCode,
          message: exceptionResponse,
          timestamp: new Date().toISOString(),
          path: request.url,
        })
        return
      }

      const payload = exceptionResponse as Record<string, unknown>
      const rawMessage = payload.message
      const message = Array.isArray(rawMessage)
        ? rawMessage
        : (rawMessage ?? exception.message)

      if (isProd && statusCode >= 500) {
        response.status(statusCode).json({
          statusCode,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
          path: request.url,
        })
        return
      }

      response.status(statusCode).json({
        statusCode,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
      return
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
