const path = require('path');

module.exports = {
  entry: './src/index.js', // Точка входа приложения
  output: {
    filename: 'bundle.js', // Имя выходного файла
    path: path.resolve(__dirname, 'dist'), // Путь к выходной директории
    clean: true, // Очищаем dist перед каждой сборкой
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Обработка JavaScript файлов через Babel
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'], // Преобразование современного JS в совместимый
          },
        },
      },
      {
        test: /\.css$/, // Обработка CSS файлов
        use: ['style-loader', 'css-loader'], // Подключение стилей в DOM
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Обработка изображений
        type: 'asset/resource', // Используем Asset Modules (Webpack 5+)
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'), // Статические файлы для DevServer
    compress: true, // Включение gzip-сжатия
    port: 3000, // Порт для разработки
    open: true, // Автоматическое открытие браузера
  },
  resolve: {
    extensions: ['.js'], // Разрешение расширений
  },
};