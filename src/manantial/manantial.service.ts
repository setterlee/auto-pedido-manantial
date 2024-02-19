import puppeteer from 'puppeteer';
import 'dotenv/config';
import { Page, Browser } from 'puppeteer';
import { clickButton } from './manantial.utils';

export async function requestProducts() {
    
    
    console.log('Iniciando proceso...');

    const browser = await puppeteer.launch({
        headless: process.env.ENV === 'dev' ? false : true,
        slowMo: process.env.ENV === 'dev' ? 50 : 0,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try{

        //Se realizan los pasos:
        const page = await login(browser);
        console.log('Paso 1: Iniciando sesión completado');
        const pedidoEnCurso = await checkIfIsOrderInProcess(page);
        console.log('Paso 2: Chequeo de pedido en proceso completado');
        if (pedidoEnCurso) {
            return pedidoEnCurso;
        }
        await selectProducts(page);
        console.log('Paso 3: Selección de productos completada');
        const diaDeEntrega = await selectDeliveryDate(page);
        console.log(`Paso 4: Selección de fecha de entrega completada. Día de entrega: ${diaDeEntrega}`);
        await selectPaymentMethod(page);
        console.log('Paso 5: Selección de método de pago completada');
        await buy(page);
    
        return `El pedido será entregado el próximo ${diaDeEntrega}`;

    }finally{
        await browser.close();
    }
    

}

async function login(browser: Browser): Promise<Page> {
    console.log('Paso 1: Iniciando sesión');

    

    const page = await browser.newPage();
    await page.goto(`${process.env.MANANTIAL_HOST}${process.env.MANANTIAL_PAGE_LOGIN}` ?? (() => { throw new Error('Host no definido en las variables de entorno'); })());


    await page.waitForSelector('#rut');

    // Ingresa el valor de USER y PASSWORD en los campos correspondientes
    await page.type('#rut', process.env.MANANTIAL_RUT ?? (() => { throw new Error('Usuario no definido en las variables de entorno'); })());
    await page.type('#password', process.env.MANANTIAL_CONTRASENA ?? (() => { throw new Error('Contrasena no definida en las variables de entorno'); })());
    // Selecciona el botón de login"
    await clickButton(page, 'form[action="/login"] button.btn.btn-secondary.btn-lg.click-loading span');

    // Espera a que la página inicie sesión (ajusta el selector y el tiempo según tu sitio web)
    await page.waitForSelector('#address-session-list');

    return page
}

async function checkIfIsOrderInProcess(page: Page): Promise<string | undefined> {
    console.log('Paso 2: Chequeo de pedido en proceso');

    console.log(`Abriendo pagina ${process.env.MANANTIAL_HOST}${process.env.MANANTIAL_PAGE_ACCOUNT}`)
    await page.goto(`${process.env.MANANTIAL_HOST}${process.env.MANANTIAL_PAGE_ACCOUNT}` ?? (() => { throw new Error('Host no definido en las variables de entorno'); })());


    await page.waitForSelector('h6.text-primary.d-block.p-t-16');

    // Primero se consulta la fecha del despacho del ultimo pedido
    
    const fechaDeDespachoUltimoPedido = await page.evaluate(() => {
        const h6 = Array.from(document.querySelectorAll('h6')).find(h => h.textContent?.includes('Fecha de despacho:'));
        return h6 ? h6.textContent?.split(':')[1].trim() : null;
    });
    
    if (!fechaDeDespachoUltimoPedido) {
        throw new Error("No se consiguio fecha de despacho de ultimo pedido");
        
    }

    console.log('Fecha de despacho del pedido:', fechaDeDespachoUltimoPedido);
    
    //Se transforma la fecha de despacho en un objeto Date tomando en cuenta que viene en formato DD/MM/YYYY
    const fechaDespachoParts = fechaDeDespachoUltimoPedido.split('/');
    const fechaDespacho = new Date(Number(fechaDespachoParts[2]), Number(fechaDespachoParts[1]) - 1, Number(fechaDespachoParts[0]));
    
    const dias: number = diferenciaEnDias(new Date(), fechaDespacho);

    if (dias === 0) {
        return `Ya hay un pedido en curso para hoy`;
    } else if (dias > 0 && dias < 15) {
        return `Se recibio un pedido hace ${dias} dia${dias > 1 ? 's' : ''}`;
    } else if (dias < 0){
        return `Ya hay un pedido en curso para dentro de ${dias * -1} dia${dias < -1 ? 's' : ''}`;
    }
    
    return undefined
}

async function selectProducts(page: Page) {
    console.log('Paso 3: Seleccionar productos');

    await clickButton(page, 'a.btn.btn-primary.click-loading span');

    // Espera a que el elemento con la clase "full-steps" y su contenido aparezca
    await page.waitForSelector('form#checkout_form_cart.online-order-form-catalog');

    // Espera por lista de productos
    await page.waitForSelector('div.row.mb-6.variants-client-section.section-botellones.box-show-botellones')

    const searchText = process.env.MANANTIAL_PRODUCTO ?? (() => { throw new Error('Producto no definido en las variables de entorno'); })();
    const qty = process.env.MANANTIAL_CANTIDAD ?? (() => { throw new Error('Cantida no definida en las variables de entorno'); })();
    // Se ejecuta en el contexto de la pagina la asignacion de la cantidad al producto configurado
    await page.evaluate((searchText: string, qty: string) => {
        const paragraphs = Array.from(document.querySelectorAll('p.small'));

        const targetParagraph = paragraphs.find(p => p.textContent?.includes(searchText));
        if (!targetParagraph) throw new Error('No se encontro el parrafo con el id del producto');

        const productCard = targetParagraph.closest('.product-card');
        if (!productCard) throw new Error('No se encontro el producto');

        const productFooter = productCard.querySelector('.product-footer');
        if (!productFooter) throw new Error('No se encontro el footer del producto');

        const input = productFooter.querySelector('input[type="number"]');
        if (!input) throw new Error('No se encontro el input de la cantidad para el producto');
        
        input.setAttribute('value', qty);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, searchText, qty);

    // Se espera a que se actualice la cantidad de producciones seleccionados sea igual a 2
    await page.waitForFunction(() => {
        const element = document.querySelector('strong#total-count-products');
        return element?.textContent === '2';
    })

    await clickButton(page, 'form#checkout_form_cart button.btn.btn-lg.btn-alt.btn-primary.button-submit-catalog.click-loading span');

}

async function selectDeliveryDate(page: Page) {
    console.log('Paso 4: Seleccionar fecha de entrega');

    try {
        // Espera a que la etiqueta <span> con data-hook="day-name" aparezca
        await page.waitForSelector('span[data-hook="day-name"]');

        // Obtiene el texto de la etiqueta <span>
        const diaText = (await page.$eval('span[data-hook="day-name"]', (span) => span.textContent)) ?? (() => { throw new Error('No se encontro el texto del día'); })();

        // Procesa el texto para obtener el nombre del día hasta la coma
        let diaDeEntrega = diaText.split(',')[0].trim();

        //Se completa el texto del día de entrega
        switch (diaDeEntrega) {
            case 'Lun':
                diaDeEntrega = 'Lunes';
                break;
            case 'Mar':
                diaDeEntrega = 'Martes';
                break;
            case 'Mié':
                diaDeEntrega = 'Miércoles';
                break;
            case 'Jue':
                diaDeEntrega = 'Jueves';
                break;
            case 'Vie':
                diaDeEntrega = 'Viernes';
                break;
            default:
                throw new Error('Día de entrega no válido');
        }

        await clickButton(page, 'form#checkout_form_delivery button.btn.btn-lg.btn-alt.btn-primary.click-loading span');

        return diaDeEntrega;
    } catch (error) {
        console.error('Error al seleccionar la fecha de entrega:', error);
        throw error; // Puedes lanzar una excepción si es necesario
    }
}

async function selectPaymentMethod(page: Page) {
    console.log('Paso 5: Seleccionar método de pago y finalizar compra');

    try {
        // Espera a que aparezca el botón con el span "Comprar"
        await page.waitForSelector('div#payment-form-box');

        // Hacer clic en el enlace con data-method-type igual a 'delivery'
        await page.click('a[data-method-type="delivery"]');

        // Espera a que aparezca el radio button con id igual a 'tarjeta' y selecciónalo
        await page.waitForSelector('input#tarjeta');
        await page.click('input#tarjeta');
    } catch (error) {
        console.error('Error al seleccionar el método de pago:', error);
        throw error; // Puedes lanzar una excepción si es necesario
    }
}

async function buy(page: Page) {
    // Hacer clic en el botón con etiqueta que termina en 'Comprar'
    await clickButton(page, 'div.checkout-submit-area button.btn.btn-lg.btn-alt.btn-primary.click-loading span');

    await page.waitForFunction(() => {
        // Se busca el elemento h1 entre todos los elementos h1 que contenga la frase '¡Compra exitosa!'
        const h1Elements = Array.from(document.querySelectorAll('h1')); // Get all h1 elements on the page.
        return h1Elements.some((element) => element.textContent?.includes('Compra exitosa'));
    
    })
   
}


function diferenciaEnDias(fechaDesde: Date, fechaHasta: Date): number {
    // Convertir ambas fechas a objetos Date sin la hora
    fechaDesde.setHours(0, 0, 0, 0);
    fechaHasta.setHours(0, 0, 0, 0);

    // Calcular la diferencia en milisegundos entre las dos fechas
    const diferenciaMs = fechaDesde.getTime() - fechaHasta.getTime();

    // Convertir la diferencia de milisegundos a días
    const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    return diferenciaDias;
}
