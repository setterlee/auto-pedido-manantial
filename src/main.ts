import express, { Express, Request, Response } from 'express';
import { requestProducts } from './manantial/manantial.service';

const app: Express = express();
const port: number = 3000; // El puerto en el que escuchará el servidor

app.use(express.json());

// Ruta POST para iniciar el proceso de compra
app.post('/realizar-pedido-manantial', async (req: Request, res: Response) => {

    try {
        const resultado = await requestProducts();
        res.json({ mensaje: resultado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al realizar el pedido: ' + error });
    }

});


app.listen(port, () => {
    // Se imprimen en consola las variables de entorno definidas en el archivo .env
    console.log('usando las siguientes ENV:');
    console.log(process.env);
    console.log(`Servidor escuchando en el puerto ${port}`);
});
