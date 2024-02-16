# Aplicación de Pedido de Agua

Esta es una aplicación que automatiza el proceso de realizar un pedido de agua en un sitio web Manantial.com. Utiliza Puppeteer para realizar acciones en la página web de pedidos. Esta guía te mostrará cómo configurar y ejecutar la aplicación.

## Estado del proyecto

Esta aplicacion aun se encuentra en fase de desarrollo por lo que su uso aun no se recomienda hasta que se pueda publicar una version estable y funcional. 

## Cosas por hacer

- [X] Remapear los selectores ya que span:contain no es un selector valido
- [X] Agregar capa REST para que el proceso sea capaz de ser ejecutado desde cualquier proceso automatico 
- [X] Publicar primera version estable y funcional
- [X] Modificar paso de seleccion de productos para tomar los productos a seleccionar de un parametro de configuracion. Actualmente solo selecciona 2 botellones de 20 litros
- [X] Agregar validacion de pedido en curso o muy reciente

## Requisitos previos

- Asegúrate de tener instalado Node.js en tu sistema. Puedes descargarlo desde [el sitio web oficial de Node.js](https://nodejs.org/).

- Asegurate de tener la libreria necesarias:
    ```bash
    sudo apt-get install ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
    ```

## Configuración

1. Clona este repositorio en tu máquina local:

   ```bash
   git clone https://github.com/tu-usuario/pedido-agua-app.git
   cd pedido-agua-app
   ``` 
    

2. Crea un archivo .env en la raíz del proyecto para almacenar tus variables de entorno. Debes definir las siguientes variables:

    ```bash
    ENV="ambiente de desarrollo (dev) o producción (production)"
    MANANTIAL_HOST="https://manantial.com"
    MANANTIAL_PAGE_LOGIN="/login"
    MANANTIAL_PAGE_ACCOUNT="/account"
    MANANTIAL_RUT="tu rut asociado a tu cuenta manantial"
    MANANTIAL_CONTRASENA="la contrasena de la cuenta"
    MANANTIAL_PRODUCTO="el codigo del producto que se desea seleccionar"
    MANANTIAL_CANTIDAD="la cantidad de botellones que se desea seleccionar"
    ``` 
    

3. Instala las dependencias del proyecto:

    ```bash
    npm install
    ``` 
    

4. Ejecuta la aplicación:
    ```bash
    npm start
    ``` 

    Esto iniciará el proceso automatizado de pedido de agua en el sitio web especificado. La aplicación seguirá los pasos definidos en el código para seleccionar productos, fecha de entrega, método de pago, etc.

5. Espera a que la aplicación complete el proceso y recibirás un mensaje con la fecha de entrega estimada del pedido.


## Personalización

Puedes personalizar el código para adaptarlo a tu sitio web y tus necesidades específicas. Consulta el código fuente en main.ts y los diferentes métodos para entender cómo funcionan las acciones automatizadas.

## Problemas conocidos

- Si el sitio web de manantial se encuentra lento o bien el internet de la maquina donde se ejecuta este programa presenta lentitud, se puede generar caidas del proceso por agotamiento del tiempo de espera.

- Si el sitio web de manantial no responde, el programa se detiene.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE.md para obtener más detalles.