import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in the expected format (contains data field), return it
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'success' in data
        ) {
          return data;
        }

        // If data is pagination data, extract pagination information
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'pagination' in data
        ) {
          return {
            data: data.data,
            success: true,
            message: 'Success',
            pagination: data.pagination,
          };
        }

        // If data is array data, check if there is pagination information
        if (
          Array.isArray(data) &&
          data.length > 0 &&
          data[0] &&
          typeof data[0] === 'object' &&
          'pagination' in data[0]
        ) {
          const pagination = data[0].pagination;
          const cleanData = data.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { pagination: _, ...cleanItem } = item;
            return cleanItem;
          });
          return {
            data: cleanData,
            success: true,
            message: 'Success',
            pagination,
          };
        }

        // For other data, check if it needs to be wrapped
        // If data is already in the expected format, return it
        if (data && typeof data === 'object' && 'data' in data) {
          return {
            data: data.data,
            success: true,
            message: 'Success',
          };
        }

        // Normal data packaging
        return {
          data,
          success: true,
          message: 'Success',
        };
      }),
    );
  }
}
