import constants from '../../shared/constants';
import express from 'express';
import fs from 'fs';
import mime from 'mime/lite';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

function fileFilter(req, file, cb) {
  const isMedia = !!mime.getType(file.originalname).match(/^(video|image|audio)\//);
  cb(null, isMedia);
}

const storage = multer.diskStorage({
  destination: '/tmp/uploads',
  filename: function(req, file, cb) {
    const random = Math.random()
      .toString()
      .substring(2);
    const filename = cleanFilename(file.originalname);
    cb(null, `${random}-${filename}`);
  },
});

function cleanFilename(filename) {
  return path.normalize(filename).replace(/^(\.\.[/\\])+/, '');
}

const MAX_SIZE = 1024 * 1024 * 20; // 20 MB
const MAX_FILES = 10;

const upload = multer({ storage, limits: { fileSize: MAX_SIZE, files: MAX_FILES, fields: MAX_FILES }, fileFilter });

const router = express.Router();
router.post('/', upload.array('files', MAX_FILES), async (req, res) => {
  const currentUser = req.session.user;
  if (!currentUser?.model) {
    throw new Error('i call shenanigans');
  }

  const fileInfo = [];
  for (const file of req.files) {
    const { localOriginal, localThumb, localNormal, publicOriginal, publicThumb, publicNormal } = getUniqueFilenames(
      file,
      currentUser.model.username
    );

    let isError = false;
    try {
      ensureDirectoriesExist(localOriginal, localThumb, localNormal);
      fs.renameSync(file.path, localOriginal);

      await resize(localOriginal, localThumb, constants.thumbWidth, constants.thumbHeight);
      await resize(localOriginal, localNormal, constants.normalWidth, constants.normalHeight);
    } catch (ex) {
      isError = true;
      console.error('Error uploading image.', ex);
    }

    fileInfo.push({
      original: publicOriginal,
      thumb: publicThumb,
      normal: publicNormal,
      originalname: file.originalname,
      isError,
    });
  }

  res.status(201).json(fileInfo);
});

function ensureDirectoriesExist(localOriginal, localThumb, localNormal) {
  const localOriginalDirname = path.dirname(localOriginal);
  try {
    fs.accessSync(localOriginalDirname);
  } catch (ex) {
    fs.mkdirSync(localOriginalDirname, { recursive: true });
  }

  const localThumbDirname = path.dirname(localThumb);
  try {
    fs.accessSync(localThumbDirname);
  } catch (ex) {
    fs.mkdirSync(localThumbDirname, { recursive: true });
  }

  const localNormalDirname = path.dirname(localNormal);
  try {
    fs.accessSync(localNormalDirname);
  } catch (ex) {
    fs.mkdirSync(localNormalDirname, { recursive: true });
  }
}

function getUniqueFilenames(file, username) {
  let localOriginal, filename, publicOriginal;
  let index = 0;

  while (!localOriginal) {
    const cleanedName = cleanFilename(file.originalname);
    const extension = path.extname(cleanedName);
    const testFilename = path.posix.basename(cleanedName, extension) + (index ? `-${index}` : '') + extension;

    const testPublicOriginal = path.join('/', 'resource', username, 'original', testFilename);
    const testOriginal = path.join(process.cwd(), 'public', testPublicOriginal);
    try {
      fs.statSync(testOriginal);
      ++index;
    } catch (ex) {
      // File doesn't exist. Great, let's create it.
      localOriginal = testOriginal;
      filename = testFilename;
      publicOriginal = testPublicOriginal;
    }
  }

  const publicThumb = path.join('/', 'resource', username, 'thumbs', filename);
  const publicNormal = path.join('/', 'resource', username, filename);
  const localThumb = path.join(process.cwd(), 'public', publicThumb);
  const localNormal = path.join(process.cwd(), 'public', publicNormal);
  return { localOriginal, localThumb, localNormal, publicOriginal, publicThumb, publicNormal };
}

async function resize(original, dest, width, height) {
  try {
    await sharp(original)
      .rotate()
      .resize(width, height, { fit: 'inside' })
      .toFile(dest);
  } catch (ex) {
    throw new Error('image resize failed');
  }
}

export default router;
