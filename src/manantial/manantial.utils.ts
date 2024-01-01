import { Page } from 'puppeteer';

// Funcion para hacer click sobre boton
export async function clickButton(page: Page, reference: string) {
    const boton = await page.$(reference);

    if (!boton) {
        throw new Error('No se encontro el botón en reference: ' + reference);
    }

    // Se espera a que el boton este habilitado
    await page.waitForSelector(reference);

    await boton.click();
}
