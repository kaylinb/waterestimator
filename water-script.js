/**
 * NOTE: global variables from rates.js file are accessible because of html <script> tag
 * 
 * ET gets divided by 12 so that it comes out to feet since it's in inches
 * The denominator of the budgets is often 100 so that it comes out to hundred cubic feet
 * commercialBillingCycleDays: three past years' billing cycle days for a given month
 * commercialUsedHCFBillingUnits: three past years' usage for a given month
 */

let data = {
    waterIsResidential: false,
    sewer: {
        isResidential: false,
        customerClass: '',
        meterSize: { decimal: 0, fraction: '' },
        usedHCFBillingUnits: 0,
    },
    water: {
        isSingleFamily: false,
        isIndoorBudget: false,
        isResidential: false,
        billingCycleDays: 0,
        customerClass: '',
        evapotranspirationRateInches: 0,
        usedHCFBillingUnits: 0,
        irrigatedAreaSquareFeet: 0,
        meterSize: { decimal: 0, fraction: '' },
        privateFireIncluded: false,
        privateFireMeterSize: '',
    },
    commercial: {
        usedHCFBillingUnits: 0,
        billingCycleDays: 0,
        commercialBillingCycleDays: { 1: 0, 2: 0, 3: 0 },
        commercialUsedHCFBillingUnits: { 1: 0, 2: 0, 3: 0 },
        meterSize: { decimal: 0, fraction: '' },
        privateFireIncluded: false,
        privateFireMeterSize: '',
    },
    reclaimed: {
        usedHCFBillingUnits: 0,
        meterSize: { decimal: 0, fraction: '' },
        irrigatedAreaSquareFeet: 0,
        evapotranspirationRateInches: 0,
    }
};

const setWaterFormData = (event) => {
    const formData = new FormData(event.currentTarget);
    const formDataEntries = Array.from(formData.entries());
    
    for (const [key, value] of formDataEntries) {
        const singleNestedStringObjectRegex = /^(\w+)\[(\w+)\]$/;
        const singleNestedMatches = key.match(singleNestedStringObjectRegex);

        const doubleNestedStringObjectRegex = /^(\w+)\[(\w+)\]\[(\w+)\]$/;
        const doubleNestedMatches = key.match(doubleNestedStringObjectRegex);
        
        if (singleNestedMatches) {
            const key1 = singleNestedMatches[1]; // e.g. sewer[name] => sewer
            const key2 = singleNestedMatches[2]; // e.g. sewer[name] => name

            if (key2 === 'meterSize') {
                const [decimal, fraction] = value.replace(/[\[\]]/g, '').split(', ');
                data[key1].meterSize = { decimal: +decimal, fraction: fraction };
            } else {
                if (!data[key1]) data[key1] = {};

                
                if (value === 'true') data[key1][key2] = true;
                else if (value === 'false') data[key1][key2] = false;
                else if (!isNaN(value) && value.trim() !== '') data[key1][key2] = Number(value);
                else data[key1][key2] = value;
            }
        } else {
            const key1 = doubleNestedMatches[1]; // e.g. commercial[billingCycleDays][1] => commercial
            const key2 = doubleNestedMatches[2]; // e.g. commercial[billingCycleDays][1] => billingCycleDays
            const key3 = doubleNestedMatches[3]; // e.g. commercial[billingCycleDays][1] => 1
        
            if (!data[key1]) data[key1] = {};
            if (!data[key1][key2]) data[key1][key2] = {};

            if (value === 'true') data[key1][key2][key3] = true;
            else if (value === 'false') data[key1][key2][key3] = false;
            else if (!isNaN(value) && value.trim() !== '') data[key1][key2][key3] = Number(value);
            else data[key1][key2][key3] = value;
        }
    }
}

const findSewerCustomerClassGroup = () => {
    const group1 = [['Residential', 'Mobile Home Parks (Per Space)'], 'insideStandardWastewater'];
    const group2 = [['Motels (Per Unit)', 'Hotels (Per Unit)'], 'motelsAndHotelsPerUnit'];
    const group3 = [['Motels (Per Living Unit)', 'Hotels (Per Living Unit)'], 'motelsAndHotelsPerLivingUnit'];
    const group4 = [['Restaurants', 'Supermarkets', 'Mortuaries', 'Bakeries'], 'commercial'];
    const group5 = [['Laundries'], 'laundries'];
    if (group1[0].includes(data.sewer.customerClass)) return group1[1];
    else if (group2[0].includes(data.sewer.customerClass)) return group2[1];
    else if (group3[0].includes(data.sewer.customerClass)) return group3[1];
    else if (group4[0].includes(data.sewer.customerClass)) return group4[1] + (data.sewer.meterSize.decimal <= 1 ? 'LessThanOrEqualToOneInchMeter' : 'GreaterThanOneInchMeter');
    else if (group5[0].includes(data.sewer.customerClass)) return group5[1];
    else return 'insideCommercial'
}

const getSewerRate = (event) => {
    resetCosts();
    setWaterFormData(event);
    const hcfBillingUnitsBudget = 8;
    for (let year = 2024; year <= 2029; year++) {
        if (year === 2024) {
            const customerClassGroup = findSewerCustomerClassGroup();
            typeof customerClassGroup !== 'insideCommercial' ?
                costs.push(sewerRates.fixed[2024][customerClassGroup]) :
                costs.push(sewerRates.fixed[2024][customerClassGroup][data.sewer.meterSize.fraction]);
        } else {
            const fixedCost = sewerRates.fixed[year];
            const mustPayVariableCost = !data.sewer.isResidential || data.sewer.usedHCFBillingUnits > hcfBillingUnitsBudget;
            const variableCost = mustPayVariableCost ? sewerRates.variable[year] * data.sewer.usedHCFBillingUnits : 0;
            costs.push(fixedCost + variableCost);
        }
    }
}

const findCommercialWaterBudget = (billingHistoryYears) => {
    // no billing history years means that the customer is on their first year, Tier 1 rates are expected in that case
    if (billingHistoryYears === 1) {
        return getArraySum(Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value));
    } else if (billingHistoryYears >= 2) {
        const commercialUsedHCFBillingUnitsSum = getArraySum(Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value));
        const commercialBillingCycleDaysSum = getArraySum(Object.values(data.commercial.commercialBillingCycleDays).filter(value => value));
        const commercialAverageDailyHCFBillingUnitsUsage = commercialUsedHCFBillingUnitsSum / commercialBillingCycleDaysSum;
        return commercialAverageDailyHCFBillingUnitsUsage * data.commercial.billingCycleDays;
    } else return 'No billing history found.';
}

const findVariableWaterCost = (year) => {
    const singleFamilyHouseSizeConstant = 4;
    const multiFamilyHouseSizeConstant = 2;
    const householdSizeConstant = data.water.isSingleFamily ? singleFamilyHouseSizeConstant : multiFamilyHouseSizeConstant;
    
    const billingUnitGallons = 748; // 1 billing unit = 1 hundred cubic feet (HCF) = 748 gallons
    const gallonsPerPersonPerDayAllotment = 47;
    const outdoorEfficiencyFactorConstant = 0.8; // also called plant factor
    
    const indoorHCFBillingUnitsBudget = (householdSizeConstant * gallonsPerPersonPerDayAllotment * data.water.billingCycleDays) / billingUnitGallons;
    const outdoorHCFBillingUnitsBudget = (data.water.irrigatedAreaSquareFeet * (data.water.evapotranspirationRateInches / 12) * outdoorEfficiencyFactorConstant) / 100;
    const budget = data.water.isIndoorBudget ? indoorHCFBillingUnitsBudget : outdoorHCFBillingUnitsBudget;
    
    
    const isResidential = data.waterIsResidential;
    const isCommercial = !data.waterIsResidential;
    
    const usedHCFBillingUnits = isResidential ? data.water.usedHCFBillingUnits : data.commercial.usedHCFBillingUnits;
    
    const tierBilling = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 };
    
    for (let accruedBillingUnits = 0; accruedBillingUnits < usedHCFBillingUnits; accruedBillingUnits++) {
        if (year === 2024 && isResidential) {
            if (accruedBillingUnits <= budget) tierBilling[data.water.isIndoorBudget ? 'tier1' : 'tier2'] += 1;
            else if (budget < accruedBillingUnits && accruedBillingUnits <= (budget * 1.50)) tierBilling['tier3'] += 1;
            else if ((budget * 1.50) < accruedBillingUnits && accruedBillingUnits <= (budget * 2.00)) tierBilling['tier4'] += 1;
            else if ((budget * 2.00) < accruedBillingUnits) tierBilling['tier5'] += 1;
            else return 'No tier found.';
        } else if (year !== 2024 && isResidential) {
            if (accruedBillingUnits <= budget) tierBilling[data.water.isIndoorBudget ? 'tier1' : 'tier2'] += 1;
            else if (budget < accruedBillingUnits && accruedBillingUnits <= (budget * 1.50)) tierBilling['tier3'] += 1;
            else if ((budget * 1.50) < accruedBillingUnits) tierBilling['tier4'] += 1;
            else return 'No tier found.';
        } else if (year === 2024 && isCommercial) {
            const billingHistoryYears = Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value).length;
            const commercialBudget = findCommercialWaterBudget(billingHistoryYears);
            
            if (!billingHistoryYears || accruedBillingUnits <= commercialBudget) tierBilling['tier1'] += 1;
            else if (commercialBudget < accruedBillingUnits && accruedBillingUnits <= (commercialBudget * 1.50)) tierBilling['tier2'] += 1;
            else if ((commercialBudget * 1.50) < accruedBillingUnits && accruedBillingUnits <= (commercialBudget * 2.00)) tierBilling['tier3'] += 1;
            else if ((commercialBudget * 2.00) < accruedBillingUnits) tierBilling['tier4'] += 1;
            else return 'No tier found.';
        } else if (year !== 2024 && isCommercial) {
            const billingHistoryYears = Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value).length;
            const commercialBudget = findCommercialWaterBudget(billingHistoryYears);
            
            if (!billingHistoryYears || accruedBillingUnits <= commercialBudget) tierBilling['tier1'] += 1;
            else if (commercialBudget < accruedBillingUnits && accruedBillingUnits <= (commercialBudget * 1.50)) tierBilling['tier2'] += 1;
            else if ((commercialBudget * 1.50) < accruedBillingUnits) tierBilling['tier3'] += 1;
            else return 'No tier found.';
        } else {
            return 'No tier found.';
        }
    }
    
    const customerClass = isResidential ? 'residential' : 'commercial';
    
    
    const tierBillingEntries = Object.entries(tierBilling);
    const tierBillingCosts = tierBillingEntries.map(([tier, units]) => {
        const tierRate = waterRates.variable[customerClass][year][tier];
        if (tierRate) return tierRate * units;
        else return 0;
    });

    return getArraySum(tierBillingCosts);
}

// current and proposed rate formulas are identical
const getWaterRate = (event) => {
    resetCosts();
    setWaterFormData(event);
    
    if (calculatorType === 'Residential Water Rates') data.waterIsResidential = true;
    else if (calculatorType === 'Commercial Water Rates') data.waterIsResidential = false;

    const meterFraction = data.waterIsResidential ? data.water.meterSize.fraction : data.commercial.meterSize.fraction;
    const privateFireIncluded = data.waterIsResidential ? data.water.privateFireIncluded : data.commercial.privateFireIncluded;
    const privateFireFraction = data.waterIsResidential ? data.water.privateFireMeterSize : data.commercial.privateFireMeterSize;

    for (let year = 2024; year <= 2029; year++) {
        const fixedCost = waterRates.fixed.domestic[year][meterFraction];
        const privateFire = privateFireIncluded ? waterRates.fixed.privateFire[year][privateFireFraction] : 0;
        const variableCost = findVariableWaterCost(year);
        costs.push(fixedCost + privateFire + variableCost);
    }
}

const findReclaimedVariableCost = (year) => {
    const outdoorEfficiencyFactorConstant = 0.8; // also called plant factor
    const reclaimedWaterBudget = data.reclaimed.irrigatedAreaSquareFeet * (data.reclaimed.evapotranspirationRateInches / 12) * outdoorEfficiencyFactorConstant;

    const usedHCFBillingUnits = data.reclaimed.usedHCFBillingUnits;

    const tierBilling = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };

    for (let accruedBillingUnits = 0; accruedBillingUnits < usedHCFBillingUnits; accruedBillingUnits++) {
        if (year === 2024) {
            if (accruedBillingUnits <= reclaimedWaterBudget) tierBilling['tier1'] += 1;
            else if (reclaimedWaterBudget < accruedBillingUnits && accruedBillingUnits <= (reclaimedWaterBudget * 1.50)) tierBilling['tier2'] += 1;
            else if ((reclaimedWaterBudget * 1.50) < accruedBillingUnits && accruedBillingUnits <= (reclaimedWaterBudget * 2.00)) tierBilling['tier3'] += 1;
            else if ((reclaimedWaterBudget * 2.00) < accruedBillingUnits) tierBilling['tier4'] += 1;
            else return 'No tier found.';
        } else {
            tierBilling[accruedBillingUnits <= reclaimedWaterBudget ? 'tier1' : 'tier2'] += 1;
        }
    }

    const tierBillingEntries = Object.entries(tierBilling);
    const tierBillingCosts = tierBillingEntries.map(([tier, units]) => {
        const tierRate = reclaimedWaterRates.variable[year][tier];
        if (tierRate) return tierRate * units;
        else return 0;
    });

    return getArraySum(tierBillingCosts);
}

// current and proposed rate formulas are identical
const getReclaimedWaterRate = (event) => {
    resetCosts();
    setWaterFormData(event);
    for (let year = 2024; year <= 2029; year++) {
        const fixedCost = reclaimedWaterRates.fixed[year][data.reclaimed.meterSize.fraction];
        const variableCost = findReclaimedVariableCost(year);;
        costs.push(fixedCost + variableCost);
    }
}