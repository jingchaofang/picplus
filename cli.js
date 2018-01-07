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
    $ picplus <path|glob> ... --out=build [--plugin=<name> ...]
    $ picplus <file> > <output>
    $ cat <file> | picplus > <output>

  Options
    -v, --version  Print picplus version
    -r, --resize   Resize the images
    -c, --compress Compress the images
    -p, --plugin   Override the imagemin default plugins
    -o, --out      Output directory
    -q, --quality  Set the quaility
    -w, --width    Geometric scaling the image to some pixels width

  Examples
    $ picplus --compress images/* --out=build
    $ picplus -c bulid/* -o=bulid
    $ picplus -c foo.png > foo-optimized.png
    $ cat test.gif | picplus -c > anothor-name.gif
    $ picplus -c --plugin=pngquant foo.png > foo-optimized.png
    $ picplus --resize --width=100 images/* --out=build
    $ picplus --r --w=100 images/* -o=build
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
  return path.resolve(__dirname, p);
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

  if (Buffer.isBuffer(input)) {
    imagemin.buffer(input, { use }).then(buf => process.stdout.write(buf));
    return;
  }

  if (opts.out) {
    spinner.start();
  }

  imagemin(input, opts.out, { use })
    .then(files => {
      if (!opts.out && files.length === 0) {
        return;
      }

      if (!opts.out && files.length > 1) {
        console.error('Cannot write multiple files to stdout, specify a `--out-dir`');
        process.exit(1);
      }

      if (!opts.out) {
        process.stdout.write(files[0].data);
        return;
      }

      spinner.stop();

      console.log(`${files.length} ${plur('image', files.length)} minified`);
    })
    .catch(err => {
      spinner.stop();
      throw err;
    });
};

const resizeHelper = (file, opts) => {
  const buffer = readChunk.sync(file, 0, 12);
  // Supported image types: jpg、png、gif、webp、tif、bmp、jxr、psd
  try {
    let imgext = imageType(buffer).ext;
    if (!SHARP_SUPPORTED_RESIZE.includes(imgext)) {
      console.error(`Unsupported: ${file}`);
    }
    return sharp(file).resize(+opts.width).toFile(`${opts.out}/icon_${opts.width}.${imgext}`);

    // .then(
    //   res => { console.log(`Complete: ${file} ${res.width}*${res.height} ${imgext}`) }
    // ).catch(
    //   err => { console.log(`${err} at ${file}`) }
    // );
  } catch (e) {
    console.error(`Unsupported image format: ${file}`);
  }
};

const resizeRun = (input, opts) => {
  Promise.map(input, item => resizeHelper(item, opts)).then(res => {
    console.log(`${res.length} images resized`);
    // if(cli.flags.compress) compressRun(input, opts);
  }).catch(
    err => { console.log(err) }
  );
};

if (!cli.input.length && process.stdin.isTTY) {
  console.error('There is noting to do!');
  process.exit(1);
}

// Compress
if (cli.flags.compress && !cli.flags.resize) {
  if (cli.input.length) {
    compressRun(cli.input, cli.flags);
  } else {
    getStdin.buffer().then(buf => compressRun(buf, cli.flags));
  }
}

// Resize
if (cli.flags.resize) {
  if (cli.input.length) {
    resizeRun(cli.input, cli.flags);
  } else {
    getStdin.buffer().then(buf => run(buf, cli.flags));
  }
}
