# picplus

```
picplus -r -w=100 ./* -o=build && cd build && picplus -c ./* -f
```

happily combine [imagemin](https://github.com/imagemin) and [sharp](https://github.com/lovell/sharp)

```
npm install picplus -g
```

## compress

```
picplus -c images/* --out=../out_images
picplus -c test.jpg --force
```

## resize

```
picplus -r images/* -w=100 --out=out_images
picplus -r test.jpg -w=100
```


## Related

[image-optimization](https://developers.google.cn/web/fundamentals/performance/optimizing-content-efficiency/image-optimization)

[automating-image-optimization](https://developers.google.cn/web/fundamentals/performance/optimizing-content-efficiency/automating-image-optimization/)
