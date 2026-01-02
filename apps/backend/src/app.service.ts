import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getAuth(): any {
    console.log('getAuth');
    return {
      success: true,
    };
  }
}
