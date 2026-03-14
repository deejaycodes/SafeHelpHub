import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || typeof value !== 'object' || !value) return value;
    return this.sanitize(value);
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') return sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} }).trim();
    if (Array.isArray(obj)) return obj.map(item => this.sanitize(item));
    if (typeof obj === 'object' && obj !== null) {
      const clean: any = {};
      for (const key of Object.keys(obj)) clean[key] = this.sanitize(obj[key]);
      return clean;
    }
    return obj;
  }
}
