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

// Ruta POST para iniciar el proceso de compra
app.post('/test', async (req: Request, res: Response) => {

    res.json({ mensaje: 'test' });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
