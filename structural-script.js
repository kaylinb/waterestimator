/* NOTE: global variables from rates.js file are accessible because of html <script> tag */

// static containers
const waterBillCalculatorForm = document.getElementById('water-bill-calculator-form');
const electricBillCalculatorForm = document.getElementById('electric-bill-calculator-form');
const calculationResultDiv = document.getElementById('calculation-result-div');
const tableDataRow = document.getElementById('table-data-row');

// conditional general containers
const seasonsHeader = document.getElementById('seasons-header');
const tableDataRow2 = document.getElementById('table-data-row-2');

// conditional water containers
const sewerRatesContainer = document.getElementById('sewer-rates-container');
const residentialWaterRatesContainer = document.getElementById('residential-water-rates-container');
const waterIsIndoorMenu = document.getElementById('water-is-indoor-menu');
const residentialWaterRatesOutdoorMenuInputContainer = document.getElementById('outdoor-menu-input-container');
const commercialWaterRatesContainer = document.getElementById('commercial-water-rates-container');
const reclaimedWaterRatesContainer = document.getElementById('reclaimed-water-rates-container');
const electricRatesContainer = document.getElementById('electric-rates-container');
const privateFireIncludedCommercialContainer = document.getElementById('private-fire-included-commercial-container');
const privateFireIncludedContainer = document.getElementById('private-fire-included-container');

// conditional electric containers
const electricUniversalInputsContainer = document.getElementById('electric-universal-inputs-container');
const electricResidentialInputsContainer = document.getElementById('electric-residential-inputs-container');
const electricTOUGS3TOU8InputsContainer = document.getElementById('electric-TOUGS3-TOU8-inputs-container');
const electricTOUGS3TOU8PAInputsContainer = document.getElementById('electric-TOUGS3-TOU8-PA-inputs-container');
const electricTOUGS3TOU8PACOMMEVInputContainer = document.getElementById('electric-TOUGS3-TOU8-PA-COMMEV-input-container');
const electricTOUGS3TOU8PAGS2COMMEVInputContainer = document.getElementById('electric-TOUGS3-TOU8-PA-GS2-COMMEV-input-container');
const electricTOUGS3TOU8PAGS2InputContainer = document.getElementById('electric-TOUGS3-TOU8-PA-GS2-input-container');
const electricGS1TC1InputContainer = document.getElementById('electric-GS1-TC1-input-container');
const electricCOMMEVInputContainer = document.getElementById('electric-COMMEV-input-container');

// general elements
const calculatorTypeMenu = document.getElementById('calculator-type-menu');

// electric elements
const electricCustomerClassMenu = document.getElementById('electric-customer-class-menu');

// residential water elements
const waterPrivateFireIncludedMenu = document.getElementById('water-private-fire-included-menu');

// commercial water elements
const commercialPrivateFireIncludedMenu = document.getElementById('commercial-water-private-fire-included-menu');

const getArraySum = (array) => array.reduce((acc, curr) => acc += curr);

let calculatorType = '';

const costs = [];

const resetDataTableElements = () => {
    seasonsHeader.style.display = 'none';
    while (tableDataRow.firstChild) {
        tableDataRow.removeChild(tableDataRow.firstChild);
    }
    
    while (tableDataRow2.firstChild) {
        tableDataRow2.removeChild(tableDataRow2.firstChild);
    }
}

const resetCosts = () => costs.length = 0;

const roundToNthDecimalPlace = (number, decimalPlaces) => {
    const factor = Math.pow(10, decimalPlaces);
    return (Math.round(number * factor) / factor).toFixed(2);
};

const makeInputsRequired = (boolean) => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const isVisible = input.offsetParent !== null;

        if (boolean && isVisible) input.setAttribute('required', true);
        else input.removeAttribute('required');
    });
};

const showContainer = (containers, showBooleans) => {
    makeInputsRequired(false);
    resetDataTableElements();
    containers.forEach((container, index) => {
        showBooleans[index] ?
        container.setAttribute('style', 'display: "";') : 
        container.setAttribute('style', 'display: none;');
    });
    makeInputsRequired(true);
};

const formatCost = (cost) => {
    const isNumber = !isNaN(cost);

    if (isNumber && cost > 0) return `$${roundToNthDecimalPlace(cost, 2)}`;
    else return '--';
}

const createTable = (seasonal) => {
    const years = [2024, 2025, 2026, 2027, 2028, 2029];

    if (seasonal) {
        showContainer([seasonsHeader, tableDataRow2], [true, true]);
        
        const { seasons, seasonalCosts } = costs[0];
        
        const winterHeader = document.createElement('th');
        winterHeader.id = 'winter-row';
        winterHeader.scope = 'row';
        winterHeader.innerText = seasons[0];
        tableDataRow.appendChild(winterHeader);
        seasonalCosts[0].forEach((cost, index) => {
            const tableDataElement = document.createElement('td');
            tableDataElement.id = `${years[index]}-${seasons[0].toLowerCase()}-cost`;
            tableDataElement.textContent = formatCost(cost);
    
            tableDataRow.appendChild(tableDataElement);
        });

        const summerHeader = document.createElement('th');
        summerHeader.id ='summer-row';
        summerHeader.scope = 'row';
        summerHeader.innerText = seasons[1];
        tableDataRow2.appendChild(summerHeader);
        seasonalCosts[1].forEach((cost, index) => {
            const tableDataElement = document.createElement('td');
            tableDataElement.id = `${years[index]}-${seasons[1].toLowerCase()}-cost`;
            tableDataElement.textContent = formatCost(cost);
    
            tableDataRow2.appendChild(tableDataElement);
        });
    } else {
        showContainer([seasonsHeader, tableDataRow2], [false, false]);

        costs.forEach((cost, index) => {
            const tableDataElement = document.createElement('td');
            tableDataElement.id = `${years[index]}-cost`;
            tableDataElement.textContent = formatCost(cost);
    
            tableDataRow.appendChild(tableDataElement);
        });
    }
}

const containerCoordinator = (utilityType, calculatorType) => {
    if (utilityType === 'water') {
        if (calculatorType === 'Sewer Rates') showContainer([waterBillCalculatorForm, sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer, reclaimedWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        else if (calculatorType === 'Residential Water Rates') showContainer([waterBillCalculatorForm, residentialWaterRatesContainer, commercialWaterRatesContainer, sewerRatesContainer, reclaimedWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        else if (calculatorType === 'Commercial Water Rates') showContainer([waterBillCalculatorForm, commercialWaterRatesContainer, residentialWaterRatesContainer, sewerRatesContainer, reclaimedWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        else if (calculatorType === 'Reclaimed Water Rates') showContainer([waterBillCalculatorForm, reclaimedWaterRatesContainer, sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        else showContainer([waterBillCalculatorForm, electricBillCalculatorForm], [false, false]);
    } else if (utilityType === 'electric') {
        showContainer([electricBillCalculatorForm, electricUniversalInputsContainer, waterBillCalculatorForm], [true, true, false], true);
        if (calculatorType === 'residential') showContainer([electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricGS1TC1InputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, false, false, false, false, false, false, false]);
        else if (calculatorType === 'smallCommercialGS1') showContainer([electricGS1TC1InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, false, false, false, false, false, false, false]);
        else if (calculatorType === 'mediumCommercialGS2') showContainer([electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricGS1TC1InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, true, false, false, false, false, false, false]);
        else if (['largeCommercialTOUGS3', 'industrialTOU8'].includes(calculatorType)) showContainer([electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer, electricGS1TC1InputContainer, electricResidentialInputsContainer, electricCOMMEVInputContainer], [true, true, true, true, true, false, false, false]);
        else if (calculatorType === 'pumpingAndAgriculture') showContainer([electricTOUGS3TOU8PAInputsContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8InputsContainer, electricGS1TC1InputContainer, electricResidentialInputsContainer, electricCOMMEVInputContainer], [true, true, true, true, false, false, false, false]);
        else if (calculatorType === 'trafficControlTC1') showContainer([electricGS1TC1InputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, false, false, false, false, false, false, false]);
        else if (calculatorType === 'commercialEVChargingRate') showContainer([electricTOUGS3TOU8PACOMMEVInputContainer, electricCOMMEVInputContainer, electricGS1TC1InputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PAInputsContainer], [true, true, false, false, false, false, false, false]);
        else showContainer([electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricGS1TC1InputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [false, false, false, false, false, false, false, false]);
    } else return 'No container category found.';
}

// Call the function to set the inputs as required
makeInputsRequired();

// general event listeners
calculatorTypeMenu.addEventListener('change', (event) => {
    const calculatorTypeValue = event?.currentTarget.value;
    const utilityType = calculatorTypeValue.includes('Electric') ? 'electric' : 'water';
    
    calculatorType = calculatorTypeValue;
    containerCoordinator(utilityType, calculatorTypeValue);
});
waterBillCalculatorForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
        if (calculatorType === 'Sewer Rates') getSewerRate(event);
        else if (calculatorType === 'Residential Water Rates') getWaterRate(event);
        else if (calculatorType === 'Commercial Water Rates') getWaterRate(event);
        else if (calculatorType === 'Reclaimed Water Rates') getReclaimedWaterRate(event);
        createTable();
    } catch (error) {
        console.error(error);
    }
});

// electric event listeners
electricBillCalculatorForm.addEventListener('submit', (event) => { 
    event.preventDefault();
    try {
        getElectricRate(event);
    } catch (error) {
        console.error(error);
    }
});
electricCustomerClassMenu.addEventListener('change', (event) => containerCoordinator('electric', event?.target.value));

// residential water menu event listeners
waterIsIndoorMenu.addEventListener('change', (event) => {
    const isOutdoor = event?.target.value === 'false';
    if (isOutdoor) showContainer([residentialWaterRatesOutdoorMenuInputContainer], [true]);
    else showContainer([residentialWaterRatesOutdoorMenuInputContainer], [false]);
});

// water event listeners
waterPrivateFireIncludedMenu.addEventListener('change', (event) => {
    const privateFireIncluded = event?.target.value === 'true';
    if (privateFireIncluded) showContainer([privateFireIncludedContainer], [true]);
    else showContainer([privateFireIncludedContainer], [false]);
});

// commercial water menu event listeners
commercialPrivateFireIncludedMenu.addEventListener('change', (event) => {
    const privateFireIncluded = event?.target.value === 'true';
    if (privateFireIncluded) showContainer([privateFireIncludedCommercialContainer], [true]);
    else showContainer([privateFireIncludedCommercialContainer], [false]);
});
