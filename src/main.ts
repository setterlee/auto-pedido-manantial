import puppeteer from 'puppeteer';
import 'dotenv/config';
import { Page } from 'puppeteer';

async function main() {
    return await runPuppeteer();
}

async function runPuppeteer() {
    const browser = await puppeteer.launch({
        headless: process.env.ENV === 'dev' ? false : true,
        slowMo: process.env.ENV === 'dev' ? 50 : 0
    });
    const page = await browser.newPage();
    await page.goto(process.env.HOST ?? (() => { throw new Error('Host no definido en las variables de entorno'); })());

    console.log('Iniciando proceso...');

    //Se realizan los pasos:
    await login(page);
    console.log('Paso 1: Iniciando sesión completado');
    await selectAddress(page);
    console.log('Paso 2: Selección de dirección completada');
    await selectProducts(page);
    console.log('Paso 3: Selección de productos completada');
    const diaDeEntrega = await selectDeliveryDate(page);
    console.log(`Paso 4: Selección de fecha de entrega completada. Día de entrega: ${diaDeEntrega}`);
    await selectPaymentMethod(page);
    console.log('Paso 5: Selección de método de pago completada');
    // await buy(page);

    // Cierra el navegador
    await browser.close();

    return `El pedido será entregado el próximo ${diaDeEntrega}`;
}

async function login(page: Page) {
    console.log('Paso 1: Iniciando sesión');

    await page.waitForSelector('#rut');

    // Ingresa el valor de USER y PASSWORD en los campos correspondientes
    await page.type('#rut', process.env.RUT ?? (() => { throw new Error('Usuario no definido en las variables de entorno'); })());
    await page.type('#password', process.env.CONTRASENA ?? (() => { throw new Error('Contrasena no definida en las variables de entorno'); })());
    // Selecciona el botón de login"
    await clickButton(page, 'form[action="/login"] button.btn.btn-secondary.btn-lg.click-loading span');

}

async function selectAddress(page: Page) {
    console.log('Paso 2: Seleccionar dirección');

    // Espera a que la página inicie sesión (ajusta el selector y el tiempo según tu sitio web)
    await page.waitForSelector('#address-session-list');

    // Espera a que el primer input de tipo radio esté seleccionado
    await page.waitForSelector('form#form-address-selection input[type="radio"]:first-child:checked');

    // Se le hace submit al formulario
    const formulario = await page.$('form#form-address-selection');

    if (!formulario) {
        throw new Error('No se encontro el formulario para seleccionar la dirección');
    }

    // Envía el formulario
    await formulario.evaluate(form => form.submit());
}

async function selectProducts(page: Page) {
    console.log('Paso 3: Seleccionar productos');

    // Espera a que el elemento con la clase "full-steps" y su contenido aparezca
    await page.waitForSelector('form#checkout_form_cart.online-order-form-catalog');

    // Espera por lista de productos
    await page.waitForSelector('div.row.mb-6.variants-client-section.section-botellones.box-show-botellones')

    const searchText = process.env.PRODUCTO ?? (() => { throw new Error('Producto no definido en las variables de entorno'); })();
    const qty = process.env.CANTIDAD ?? (() => { throw new Error('Cantida no definida en las variables de entorno'); })();
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
            case 'Mie':
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

async function buy(page: Page, diaDeEntrega: string) {
    // Hacer clic en el botón con etiqueta que termina en 'Comprar'
    await page.click('button span:contains("Comprar")');

    // Puedes agregar una espera adicional si es necesario para asegurarte de que la página se actualice correctamente

    console.log(`Paso 6: Compra realizada con éxito. El pedido será entregado el próximo ${diaDeEntrega}`);
}



// Funcion para hacer click sobre boton
async function clickButton(page: Page, reference: string) {
    const boton = await page.$(reference);

    if (!boton) {
        throw new Error('No se encontro el botón en reference: ' + reference);
    }

    // Se espera a que el boton este habilitado
    await page.waitForSelector(reference);

    await boton.click();
}


main();
