/**
 * Type definitions for exif-parser
 */

declare module 'exif-parser' {
  interface ExifTags {
    GPSLatitude?: number | number[];
    GPSLatitudeRef?: string;
    GPSLongitude?: number | number[];
    GPSLongitudeRef?: string;
    GPSAltitude?: number;
    GPSDOP?: number;
    [key: string]: any;
  }

  interface ExifResult {
    tags?: ExifTags;
    imageSize?: {
      width: number;
      height: number;
    };
    thumbnailOffset?: number;
    thumbnailLength?: number;
    thumbnailType?: number;
    app1Offset?: number;
  }

  interface ExifParser {
    parse(): ExifResult;
    enableBinaryFields(enable: boolean): ExifParser;
    enablePointers(enable: boolean): ExifParser;
    enableTagNames(enable: boolean): ExifParser;
    enableImageSize(enable: boolean): ExifParser;
    enableReturnTags(enable: boolean): ExifParser;
    enableSimpleValues(enable: boolean): ExifParser;
  }

  function create(buffer: Buffer): ExifParser;

  export = { create };
}
