import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export function createRangeStreamHandler(filePath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `맵 파일 또는 리소스를 찾을 수 없습니다: ${path.basename(filePath)}` }
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!range) {
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', 'application/octet-stream');
      return fs.createReadStream(filePath).pipe(res);
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).send('Requested Range Not Satisfiable');
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
    });

    file.pipe(res);
  };
}
