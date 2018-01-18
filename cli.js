#!/usr/bin/env node

const arrify = require('arrify');
const meow = require('meow');
const sharp = require('sharp');
const Promise = require("bluebird");
const getStdin = require('get-stdin');
const ora = require('ora');
const plur = require('plur');
const stripIndent = require('strip-indent');
const imagemin = require('imagemin');
const readChunk = require('read-chunk');
const imageType = require('image-type');
const path = require('path');
const fs = require('fs');

const cli = meow(`
  Usage
    $ picplus -c <path|glob> ... --out=build [--plugin=<name> ...]
    $ picplus -r <path|file|glob>... --out=build [--width=<number> ...]

  Options
    -v, --version   Print picplus version
    -c, --compress  Compress the images
      -p, --plugin  Override the imagemin default plugins
      -q, --quality Set the quaility
    -r, --resize    Resize the images
      -w, --width   Geometric scaling the image to the width
    -o, --out       Output directory

  Examples
    $ picplus -c images/* --out=build
    $ picplus -c --plugin=pngquant images/* --out=build
    $ picplus -r --width=100 images/* --out=build
`, {
  flags: {
    version: {
      type: 'boolean',
      alias: 'v'
    },
    compress: {
      type: 'boolean',
      alias: 'c'
    },
    resize: {
      type: 'boolean',
      alias: 'r'
    },
    plugin: {
      type: 'string',
      alias: 'p'
    },
    out: {
      type: 'string',
      alias: 'o'
    },
    width: {
      type: 'string',
      alias: 'w'
    },
    force: {
      type: 'boolean',
      alias: 'f'
    }
  }
});

const DEFAULT_PLUGINS = [
  'gifsicle',
  'jpegtran',
  'optipng',
  'svgo'
];

const SHARP_SUPPORTED_RESIZE = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'tiff',
  'tif'
];

function resolvePath(p) {
  return path.resolve(process.cwd(), p);
}

if (cli.flags.out && !fs.existsSync(resolvePath(cli.flags.out))) {
  fs.mkdirSync(resolvePath(cli.flags.out));
}

const requirePlugins = plugins => plugins.map(x => {
  try {
    return require(`imagemin-${x}`)();
  } catch (err) {
    console.error(stripIndent(`
      Unknown plugin: ${x}
      Did you forget to install the plugin?
      You can install it with:
        $ npm install -g imagemin-${x}
    `).trim());
    process.exit(1);
  }
});

const compressRun = (input, opts) => {
  opts = Object.assign({ plugin: DEFAULT_PLUGINS }, opts);

  const use = requirePlugins(arrify(opts.plugin));
  const spinner = ora('Minifying images');

  // if (Buffer.isBuffer(input)) {
  //   imagemin.buffer(input, { use }).then(buf => process.stdout.write(buf));
  //   return;
  // }

  if(!opts.out && opts.force) {
    opts.out = process.cwd();
  }

  if (opts.out) {
    spinner.start();
  }

  imagemin(input, opts.out, { use })
    .then(files => {
      if (!opts.out && files.length === 0) {
        console.error('Cannot be compressed !');
        return;
      }

      if (!opts.out && files.length >= 1) {
        console.error('Please specify a `--out` or override by `--force`');
        process.exit(1);
      }

      // if (!opts.out) {
      //   process.stdout.write(files[0].data);
      //   return;
      // }

      spinner.stop();

      console.log(`${files.length} ${plur('image', files.length)} minified`);
    })
    .catch(err => {
      spinner.stop();
      throw err;
    });
};

const resizeHelper = (file, opts) => {
  try {
    let outdir = resolvePath(opts.out +'/'+ opts.width + '_' + path.basename(file));
    // Can detect image types: jpg、png、gif、webp、tif、bmp、jxr、psd
    let imgext = imageType(readChunk.sync(file, 0, 12)).ext;
    if (SHARP_SUPPORTED_RESIZE.includes(imgext)) {
      sharp(file).resize(+opts.width).toFile(`${outdir}`).then(data => {
        console.log(`${file} resized ${data.width}*${data.height}`)
      }).catch(err => {
        console.error(`${file} ${err}`);
      });
    }
  } catch(e) {
    console.error(`${file} the file specified was an invalid or unsupported file format`);
  }
};

const resizeRun = (input, opts) => {
  if(!opts.out) {
    console.error('Please specify a `--out` or `-o`');
    process.exit(1);
  }

  for(let i = 0; i < input.length; i++) {
    resizeHelper(input[i], opts);
  }
};

if (!cli.input.length && process.stdin.isTTY) {
  console.error('Please input some files !');
  process.exit(1);
}

// Compress
if (cli.flags.compress && !cli.flags.resize) {
  if (cli.input.length) {
    compressRun(cli.input, cli.flags);
  } 
  // else {
  //   getStdin.buffer().then(buf => compressRun(buf, cli.flags));
  // }
}

// Resize
if (cli.flags.resize) {
  if (cli.input.length) {
    resizeRun(cli.input, cli.flags);
  }
  // else {
  //   getStdin.buffer().then(buf => run(buf, cli.flags));
  // }
}
