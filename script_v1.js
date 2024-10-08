// global variables from rates.js file are accessible because of html <script> tag

/**
 * ET gets divided by 12 because it is in inches
 * The denominator of the budgets is often 100 so that it comes out to hundred cubic feet
 */

let calculatorType = '';

const initialData = {
    billingCycleDays: 0,
    commercialBillingCycleDays: { 1: null, 2: null, 3: null }, // three past years' billing cycle days for a given month
    commercialHundredCubicFeetUsages: { 1: null, 2: null, 3: null }, // three past years' usage for a given month
    customerClass: '',
    evapotranspirationRateInches: 0, // UC Riverside Station 44 (https://cimis.water.ca.gov/WSNReportCriteria.aspx)
    hundredCubicFeetUsage: 0,
    isIndoorBudget: false,
    irrigatedAreaSquareFeet: 0,
    isResidential: false,
    isSingleFamily: false,
    meterSize: { decimal: 0, fraction: '' },
    privateFireIncluded: false,
};

let data = JSON.parse(JSON.stringify(initialData));

const costs = [];

const findSewerCustomerClassGroup = () => {
    const group1 = [['Residential', 'Mobile Home Parks (Per Space)'], 'insideStandardWastewater'];
    const group2 = [['Motels (Per Unit)', 'Hotels (Per Unit)'], 'motelsAndHotelsPerUnit'];
    const group3 = [['Motels (Per Living Unit)', 'Hotels (Per Living Unit)'], 'motelsAndHotelsPerLivingUnit'];
    const group4 = [['Restaurants', 'Supermarkets', 'Mortuaries', 'Bakeries'], 'commercial'];
    const group5 = [['Laundries'], 'laundries'];
    if (group1[0].includes(data.customerClass)) return group1[1];
    else if (group2[0].includes(data.customerClass)) return group2[1];
    else if (group3[0].includes(data.customerClass)) return group3[1];
    else if (group4[0].includes(data.customerClass)) return group4[1] + (data.meterSize.decimal <= 1 ? 'LessThanOrEqualToOneInchMeter' : 'GreaterThanOneInchMeter');
    else if (group5[0].includes(data.customerClass)) return group5[1];
    else return 'insideCommercial'
}

const getSewerRate = () => {
    const hundredCubicFeetBudget = 8;
    for (let year = 2024; year <= 2029; year++) {
        if (year === 2024) {
            const customerClassGroup = findSewerCustomerClassGroup();
            typeof customerClassGroup !== 'insideCommercial' ?
                costs.push(sewerRates.fixed[2024][customerClassGroup]) :
                costs.push(sewerRates.fixed[2024][customerClassGroup][data.meterSize.fraction]);
        } else {
            const fixedCost = sewerRates.fixed[year];
            const mustPayVariableCost = !data.isResidential || data.hundredCubicFeetUsage > hundredCubicFeetBudget;
            const variableCost = mustPayVariableCost ? sewerRates.variable[year] * data.hundredCubicFeetUsage : 0;
            costs.push(fixedCost + variableCost);
        }
    }
}

const findCommercialWaterBudget = (billingHistoryYears) => {
    // no billing history years means that the customer is on their first year, Tier 1 rates are expected in that case
    if (billingHistoryYears === 1) {
        return Object.values(data.commercialHundredCubicFeetUsages).filter(value => value !== null);
    } else if (billingHistoryYears >= 2) {
        const commercialHundredCubicFeetUsagesSum = Object.values(data.commercialHundredCubicFeetUsages).filter(value => value !== null).reduce((acc, curr) => acc += curr);
        const commercialBillingCycleDaysSum = Object.values(data.commercialBillingCycleDays).filter(value => value !== null).reduce((acc, curr) => acc += curr);
        const commercialAverageDailyHundredCubicFeetUsage = commercialHundredCubicFeetUsagesSum / commercialBillingCycleDaysSum;
        return commercialAverageDailyHundredCubicFeetUsage;
    } else {
        return 'No billing history found.';
    }
}

const findWaterUsageTier = (year) => {
    const singleFamilyHouseSizeConstant = 4;
    const multiFamilyHouseSizeConstant = 2;
    const householdSizeConstant = data.isSingleFamily ? singleFamilyHouseSizeConstant : multiFamilyHouseSizeConstant;

    const billingUnitGallons = 748; // 1 hundred cubic feet = 748 gallons
    const gallonsPerPersonPerDayAllotment = 47;
    const outdoorEfficiencyFactorConstant = 0.8; // also called plant factor

    const indoorHundredCubicFeetBudget = (householdSizeConstant * gallonsPerPersonPerDayAllotment * data.billingCycleDays) / billingUnitGallons;
    const outdoorHundredCubicFeetBudget = (data.irrigatedAreaSquareFeet * (data.evapotranspirationRateInches / 12) * outdoorEfficiencyFactorConstant) / 100;
    const budget = data.isIndoorBudget ? indoorHundredCubicFeetBudget : outdoorHundredCubicFeetBudget;
    const billingHistoryYears = Object.values(data.commercialHundredCubicFeetUsages).filter(value => value !== null).length;

    if (year === 2024 && data.isResidential) {
        if (data.hundredCubicFeetUsage <= budget) return data.isIndoorBudget ? 'tier1' : 'tier2';
        else if (budget < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (budget * 1.50)) return 'tier3';
        else if ((budget * 1.50) < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (budget * 2.00)) return 'tier4';
        else if ((budget * 2.00) < data.hundredCubicFeetUsage) return 'tier5';
        else return 'No tier found.';
    } else if (year !== 2024 && data.isResidential) {
        if (data.hundredCubicFeetUsage <= budget) return data.isIndoorBudget ? 'tier1' : 'tier2';
        else if (budget < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (budget * 1.50)) return 'tier3';
        else if ((budget * 1.50) < data.hundredCubicFeetUsage) return 'tier4';
        else return 'No tier found.';
     } else if (year === 2024 && !data.isResidential) {
        if (!billingHistoryYears) return 'tier1';
        const commercialBudget = findCommercialWaterBudget(billingHistoryYears);

        if (data.hundredCubicFeetUsage <= commercialBudget) return 'tier1';
        else if (commercialBudget < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (commercialBudget * 1.50)) return 'tier2';
        else if ((commercialBudget * 1.50) < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (commercialBudget * 2.00)) return 'tier3';
        else if ((commercialBudget * 2.00) < data.hundredCubicFeetUsage) return 'tier4';
        else return 'No tier found.';
    } else if (year !== 2024 && !data.isResidential) {
        if (!billingHistoryYears) return 'tier1';
        const commercialBudget = findCommercialWaterBudget(billingHistoryYears);

        if (data.hundredCubicFeetUsage <= commercialBudget) return 'tier1';
        else if (commercialBudget < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (commercialBudget * 1.50)) return 'tier2';
        else if ((commercialBudget * 1.50) < data.hundredCubicFeetUsage) return 'tier3';
        else return 'No tier found.';
    } else {
        return 'No tier found.';
    }
}

// Current and proposed rate formulas are identical
const getWaterRate = () => {
    for (let year = 2024; year <= 2029; year++) {
        const customerClass = data.isResidential ? 'residential' : 'commercial';
        const tier = findWaterUsageTier(year);

        const fixedCost = waterRates.fixed.domestic[year][data.meterSize.fraction];
        const privateFire = data.privateFireIncluded ? waterRates.fixed.privateFire[year][data.meterSize.fraction] : 0;
        const variableCost = waterRates.variable[customerClass][year][tier] * data.hundredCubicFeetUsage;
        costs.push(fixedCost + privateFire + variableCost);
    }
}

const findReclaimedWaterUsageTier = (year) => {
    const outdoorEfficiencyFactorConstant = 0.8; // also called plant factor
    const hundredCubicFeetBudget = data.irrigatedAreaSquareFeet * (data.evapotranspirationRateInches / 12) * outdoorEfficiencyFactorConstant;

    if (year === 2024) {
        if (data.hundredCubicFeetUsage <= hundredCubicFeetBudget) return 'tier1';
        else if (hundredCubicFeetBudget < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (hundredCubicFeetBudget * 1.50)) return 'tier2';
        else if ((hundredCubicFeetBudget * 1.50) < data.hundredCubicFeetUsage && data.hundredCubicFeetUsage <= (hundredCubicFeetBudget * 2.00)) return 'tier3';
        else if ((hundredCubicFeetBudget * 2.00) < data.hundredCubicFeetUsage) return 'tier4';
        else return 'No tier found.';
    } else {
        return data.hundredCubicFeetUsage <= hundredCubicFeetBudget ? 'tier1' : 'tier2';
    }
}

// Current and proposed rate formulas are identical
const getReclaimedWaterRate = () => {
    for (let year = 2024; year <= 2029; year++) {
        const tier = findReclaimedWaterUsageTier(year);

        const fixedCost = reclaimedWaterRates.fixed[year][data.meterSize.fraction];
        const variableCost = reclaimedWaterRates.variable[year][tier] * data.hundredCubicFeetUsage;
        costs.push(fixedCost + variableCost);
    }
}

// static containers
const billCalculatorForm = document.getElementById('bill-calculator-form');
const calculationResultDiv = document.getElementById('calculation-result-div');
const tableDataRow = document.getElementById('table-data-row');

// conditional containers
const sewerRatesContainer = document.getElementById('sewer-rates-container');
const residentialWaterRatesContainer = document.getElementById('residential-water-rates-container');
const residentialWaterRatesOutdoorMenuInputContainer = document.getElementById('outdoor-menu-input-container');
const commercialWaterRatesContainer = document.getElementById('commercial-water-rates-container');
const reclaimedWaterRatesContainer = document.getElementById('reclaimed-water-rates-container');

// general elements
const calculatorTypeMenu = document.querySelector("[name='calculator-type-menu']");
const formResetButton = document.querySelector("button[type='reset']");
const formSubmitButton = document.getElementById("form-submit-button");

// sewer elements
const sewerCustomerClassMenu = document.querySelector("[name='sewer-customer-class-menu']");
const sewerMeterSizeMenu = document.querySelector("[name='sewer-meter-size-menu']");
const sewerIsResidentialMenu = document.querySelector("[name='sewer-is-residential-menu']");
const sewerHundredCubicFeetMenu = document.querySelector("[name=sewer-hundred-cubic-feet-usage-menu]");

// residential water elements
const waterIsIndoorMenu = document.querySelector("[name='water-is-indoor-menu']");
const waterIrrigatedAreaInput = document.querySelector("[name='water-irrigated-area-input']");
const waterEvapotranspirationRateInput = document.querySelector("[name='water-evapotranspiration-rate-input']");
const waterHundredCubicFeetMenu = document.querySelector("[name='water-hundred-cubic-feet-usage-menu']");
const waterBillingCycleDaysInput = document.querySelector("[name='water-billing-cycle-days-input']");
const waterMeterSizeMenu = document.querySelector("[name='water-meter-size-menu']");
const waterIsSingleFamilyMenu = document.querySelector("[name='water-is-single-family-menu']");
const waterPrivateFireIncludedMenu = document.querySelector("[name='water-private-fire-included-menu']");

// commercial water elements
const commercialHundredCubicFeetUsageInput = document.querySelector("[name='commercial-water-hundred-cubic-feet-usage-menu']");
const commercialHundredCubicFeetUsageInput1 = document.querySelector("[name='commercial-water-hundred-cubic-feet-past-usage-input-1']");
const commercialHundredCubicFeetUsageInput2 = document.querySelector("[name='commercial-water-hundred-cubic-feet-past-usage-input-2']");
const commercialHundredCubicFeetUsageInput3 = document.querySelector("[name='commercial-water-hundred-cubic-feet-past-usage-input-3']");
const commercialBillingCycleDaysInput1 = document.querySelector("[name='commercial-water-billing-cycle-days-input-1']");
const commercialBillingCycleDaysInput2 = document.querySelector("[name='commercial-water-billing-cycle-days-input-2']");
const commercialBillingCycleDaysInput3 = document.querySelector("[name='commercial-water-billing-cycle-days-input-3']");
const commercialWaterMeterSizeMenu = document.querySelector("[name='commercial-water-meter-size-menu']");
const commercialPrivateFireIncludedMenu = document.querySelector("[name='commercial-water-private-fire-included-menu']");

// reclaimed water elements
const reclaimedWaterHundredCubicFeetUsageMenu = document.getElementById('reclaimed-water-hundred-cubic-feet-usage-menu');
const reclaimedWaterMeterSizeMenu = document.getElementById('reclaimed-water-meter-size-menu');
const reclaimedWaterIrrigatedAreaInput = document.getElementById('reclaimed-water-irrigated-area-input');
const reclaimedWaterEvapotranspirationRateInput = document.getElementById('reclaimed-water-evapotranspiration-rate-input');

const resetTableDataRow = () => {
    while (tableDataRow.firstChild) {
        tableDataRow.removeChild(tableDataRow.firstChild);
    }
}

const resetCosts = () => costs.length = 0;

const resetAllData = () => {
    data = JSON.parse(JSON.stringify(initialData));
    resetCosts();
    billCalculatorForm.reset();
    resetTableDataRow();
};

const createTable = () => {
    const years = [2024, 2025, 2026, 2027, 2028, 2029];

    resetTableDataRow();

    costs.forEach((cost, index) => {
        const tableDataElement = document.createElement('td');
        tableDataElement.id = `${years[index]}-cost`;
        tableDataElement.textContent = `$${roundToNthDecimalPlace(cost, 2)}`;

        tableDataRow.appendChild(tableDataElement);
    });
} 

const roundToNthDecimalPlace = (number, decimalPlaces) => {
    const factor = Math.pow(10, decimalPlaces);
    return (Math.round(number * factor) / factor).toFixed(2);
};

const showContainer = (containers, showBooleans, persistData) => {
    containers.forEach((container, index) => {
        showBooleans[index] ?
        container.setAttribute('style', 'display: block;') : 
        container.setAttribute('style', 'display: none;');
    })
    if (!persistData) resetAllData();
};

const calculate = () => {
    if (calculatorType === 'Sewer Rates') getSewerRate();
    else if (calculatorType === 'Residential Water Rates') getWaterRate();
    else if (calculatorType === 'Commercial Water Rates') getWaterRate();
    else if (calculatorType === 'Reclaimed Water Rates') getReclaimedWaterRate();
    // else if (calculatorType === 'Electric Rates') getElectricRate();
    else return 'No rate calculator found.';

    createTable();
    resetCosts();
}

const controller = (eventKey, event) => {
    const value = event?.currentTarget.value;
    const isNumber = /^-?\d*(\.\d+)?$/.test(value);
    const isTrue = value?.toLowerCase() === 'true';
    const isBoolean = isTrue || value?.toLowerCase() === 'false';

    if (eventKey === 'calculatorType') {
        if (value === 'Sewer Rates') showContainer([sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer, reclaimedWaterRatesContainer], [true, false, false, false]);
        else if (value === 'Residential Water Rates') {
            showContainer([residentialWaterRatesContainer, commercialWaterRatesContainer, sewerRatesContainer, reclaimedWaterRatesContainer], [true, false, false, false]);
            data.isResidential = true;
        } else if (value === 'Commercial Water Rates') {
            showContainer([commercialWaterRatesContainer, residentialWaterRatesContainer, sewerRatesContainer, reclaimedWaterRatesContainer], [true, false, false, false]);
            data.isResidential = false;
        }
        else if (value === 'Reclaimed Water Rates') showContainer([reclaimedWaterRatesContainer, sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer], [true, false, false, false]);
        else showContainer([sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer, reclaimedWaterRatesContainer], [false, false, false, false]);
        calculatorType = value;
    } else if (eventKey === 'meterSize') {
        const [decimal, fraction] = value.replace(/[\[\]]/g, '').split(', ');
        data.meterSize.decimal = +decimal;
        data.meterSize.fraction = fraction;
    } 
    else if (eventKey === 'commercialHundredCubicFeetUsage1') data.commercialHundredCubicFeetUsages[1] = +value;
    else if (eventKey === 'commercialHundredCubicFeetUsage2') data.commercialHundredCubicFeetUsages[2] = +value;
    else if (eventKey === 'commercialHundredCubicFeetUsage3') data.commercialHundredCubicFeetUsages[3] = +value;
    else if (eventKey === 'billingCycleDays1') data.commercialBillingCycleDays[1] = +value;
    else if (eventKey === 'billingCycleDays2') data.commercialBillingCycleDays[2] = +value;
    else if (eventKey === 'billingCycleDays3') data.commercialBillingCycleDays[3] = +value;
    else if (eventKey === 'submitForm') calculate();
    else if (eventKey === 'resetAllData') resetAllData();
    else if (isBoolean) data[eventKey] = isTrue ? true : false;
    else if (isNumber) data[eventKey] = +value;
    else data[eventKey] = value;
};

// general event listeners
calculatorTypeMenu.addEventListener('change', (event) => controller('calculatorType', event));
formResetButton.addEventListener('click', (event) => controller('resetAllData', event));
formSubmitButton.addEventListener('click', (event) => controller('submitForm', event));

// sewer menu event listeners
sewerCustomerClassMenu.addEventListener('change', (event) => controller('customerClass', event));
sewerMeterSizeMenu.addEventListener('change', (event) => controller('meterSize', event));
sewerIsResidentialMenu.addEventListener('change', (event) => controller('isResidential', event));
sewerHundredCubicFeetMenu.addEventListener('input', (event) => controller('hundredCubicFeetUsage', event));

// residential water menu event listeners
waterIsIndoorMenu.addEventListener('change', (event) => {
    event?.target.value === 'true' ?
    residentialWaterRatesOutdoorMenuInputContainer.setAttribute('style', 'display: none;') :
    residentialWaterRatesOutdoorMenuInputContainer.setAttribute('style', 'display: block;');
    controller('isIndoorBudget', event);
});
waterIrrigatedAreaInput.addEventListener('input', (event) => controller('irrigatedAreaSquareFeet', event));
waterEvapotranspirationRateInput.addEventListener('input', (event) => controller('evapotranspirationRateInches', event));
waterHundredCubicFeetMenu.addEventListener('input', (event) => controller('hundredCubicFeetUsage', event));
waterBillingCycleDaysInput.addEventListener('input', (event) => controller('billingCycleDays', event));
waterMeterSizeMenu.addEventListener('change', (event) => controller('meterSize', event));
waterIsSingleFamilyMenu.addEventListener('change', (event) => controller('isSingleFamily', event));
waterPrivateFireIncludedMenu.addEventListener('change', (event) => controller('privateFireIncluded', event));

// commercial water menu event listeners
commercialHundredCubicFeetUsageInput.addEventListener('input', (event) => controller('hundredCubicFeetUsage', event));
commercialHundredCubicFeetUsageInput1.addEventListener('input', (event) => controller('commercialHundredCubicFeetUsage1', event));
commercialHundredCubicFeetUsageInput2.addEventListener('input', (event) => controller('commercialHundredCubicFeetUsage2', event));
commercialHundredCubicFeetUsageInput3.addEventListener('input', (event) => controller('commercialHundredCubicFeetUsage3', event));
commercialBillingCycleDaysInput1.addEventListener('input', (event) => controller('billingCycleDays1', event));
commercialBillingCycleDaysInput2.addEventListener('input', (event) => controller('billingCycleDays2', event));
commercialBillingCycleDaysInput3.addEventListener('input', (event) => controller('billingCycleDays3', event));
commercialWaterMeterSizeMenu.addEventListener('change', (event) => controller('meterSize', event));
commercialPrivateFireIncludedMenu.addEventListener('change', (event) => controller('privateFireIncluded', event));

// reclaimed water event listeners
reclaimedWaterHundredCubicFeetUsageMenu.addEventListener('input', (event) => controller('hundredCubicFeetUsage', event));
reclaimedWaterMeterSizeMenu.addEventListener('change', (event) => controller('meterSize', event));
reclaimedWaterIrrigatedAreaInput.addEventListener('input', (event) => controller('irrigatedArea', event));
reclaimedWaterEvapotranspirationRateInput.addEventListener('input', (event) => controller('evapotranspirationRate', event));
