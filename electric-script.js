/**
* NOTE: global variables from rates.js file are accessible because of html <script> tag
* kW (kilowatts): This measures real or working power, the actual work done by electrical equipment,
* kVAR (kilovolt-amperes reactive): This measures reactive power, the part of electricity that
does no useful work but is necessary to maintain the voltage levels for the system.
* kVA (kilovolt-amperes): This measures apparent power, which includes both real power (kW) and reactive power (kVAR)
*/

let electricFormData = {
    // ALL
    customerClass: '',
    kWhTotalMonthlyEnergyUsage: 0,
    // ONLY residential
    familyType: false,
    numberOfResidentElectricVehicles: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8
    kWSummerOnPeakDemand: 0,
    kWSummerMidPeakDemand: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture
    kWhSummerOnPeakEnergyUsage: 0,
    kWhSummerMidPeakEnergyUsage: 0,
    kWhSummerOffPeakEnergyUsage: 0,
    kWhWinterMidPeakEnergyUsage: 0,
    kWhWinterOffPeakEnergyUsage: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture, mediumCommercialGS2
    kWFacilitiesRelatedDemand: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture, commercialEVChargingRate
    kVARReactivePower: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture, mediumCommercialGS2, commercialEVChargingRate
    kWPeakFrom4PMto9PMDemand: 0,
    // ONLY smallCommercialGS1, trafficControlTC1
    phaseType: '',
    // ONLY commercialEVChargingRate
    kWMonthDemandPeak: 0,
    kWhEnergyOnPeak4To9PMEnergyUsage: 0,
    kWhEnergyOffPeak4To9PMEnergyUsage: 0,
    // ONLY commercialEVChargingRate (for bills before 2025 trying to calculate kWhEnergyOnPeak4To9PMEnergyUsage)
    kWhSummerOnPeakCalculator: 0,
    kWhSummerMidPeakCalculator: 0,
    kWhWinterMidPeakCalculator: 0,
};

const kWhSummerOnPeakCalculatorInput = document.getElementById('summer-on-peak-energy-calculator-input');
const kWhSummerMidPeakCalculatorInput = document.getElementById('summer-mid-peak-energy-calculator-input');
const kWhWinterMidPeakCalculatorInput = document.getElementById('winter-mid-peak-energy-calculator-input');

kWhSummerOnPeakCalculatorInput.addEventListener('change', (event) => electricFormData.kWhSummerOnPeakCalculator = +event?.target.value);
kWhSummerMidPeakCalculatorInput.addEventListener('change', (event) => electricFormData.kWhSummerMidPeakCalculator = +event?.target.value);
kWhWinterMidPeakCalculatorInput.addEventListener('change', (event) => electricFormData.kWhWinterMidPeakCalculator = +event?.target.value);


const kWhEnergyOnPeak4To9PMEnergyUsageEstimator = (season) => {
    const averageAmountOfMonthlyWeekdays = 21.74;
    const averageAmountOfMonthlyWeekendDays = 8.7;

    const kWhSummer4To9PMPeakUsageEstimate = kWhSummerOnPeakCalculatorInput + kWhSummerMidPeakCalculatorInput;
    
    const kWhWinter4To9PMPeakPerWeekdayEstimate = kWhWinterMidPeakCalculatorInput / averageAmountOfMonthlyWeekdays;
    const kWhWinter4To9PMPeakWeekendsEstimate = kWhWinter4To9PMPeakPerWeekdayEstimate * averageAmountOfMonthlyWeekendDays;
    const kWhWinter4To9PMPeakUsageEstimate = kWhWinterMidPeakCalculatorInput + kWhWinter4To9PMPeakWeekendsEstimate;

    return season === 'Summer' ? kWhSummer4To9PMPeakUsageEstimate : kWhWinter4To9PMPeakUsageEstimate;
}

const setElectricFormData = (event) => {
    const formData = new FormData(event.currentTarget);
    const formDataEntries = Array.from(formData.entries());
    
    electricFormData = Object.fromEntries(formDataEntries);
    
    for (const [key, value] of formDataEntries) {
        if (value === 'true') electricFormData[key] = true;
        else if (value === 'false') electricFormData[key] = false;
        else if (!isNaN(value) && value.trim() !== '') electricFormData[key] = Number(value);
        else electricFormData[key] = value;
    }
}

const findVariableElectricCost = (year, season) => {
    const residentialRates = electricRates.residential;
    let kWhBaseline = (season === 'Summer') ? residentialRates.kWhSummerBaseline : residentialRates.kWhWinterBaseline;
    const totalElectricVehiclesBoost = electricFormData.numberOfResidentElectricVehicles * residentialRates.kWhElectricVehicleBaselineBoost;
    kWhBaseline += totalElectricVehiclesBoost;
    
    const tierBilling = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };

    for (let kWhAccruedUsage = 0; kWhAccruedUsage < electricFormData.kWhTotalMonthlyEnergyUsage; kWhAccruedUsage++) {
        if (year === 2024) {
            if (electricFormData.kWhTotalMonthlyEnergyUsage <= kWhBaseline) tierBilling['tier1'] += 1;
            else if (kWhBaseline < electricFormData.kWhTotalMonthlyEnergyUsage && electricFormData.kWhTotalMonthlyEnergyUsage <= (kWhBaseline * 1.30)) tierBilling['tier2'] += 1;
            else if ((kWhBaseline * 1.30) < electricFormData.kWhTotalMonthlyEnergyUsage && electricFormData.kWhTotalMonthlyEnergyUsage <= (kWhBaseline * 2.00)) tierBilling['tier3'] += 1;
            else if ((kWhBaseline * 2.00) < electricFormData.kWhTotalMonthlyEnergyUsage) tierBilling['tier4'] += 1;
        } else {
            if (electricFormData.kWhTotalMonthlyEnergyUsage <= kWhBaseline) tierBilling['tier1'] += 1;
            else if (kWhBaseline < electricFormData.kWhTotalMonthlyEnergyUsage && electricFormData.kWhTotalMonthlyEnergyUsage <= (kWhBaseline * 1.30)) tierBilling['tier2'] += 1;
            else if ((kWhBaseline * 1.30) < electricFormData.kWhTotalMonthlyEnergyUsage) tierBilling['tier3'] += 1;
        }
    }

    const tierBillingEntries = Object.entries(tierBilling);
    const tierBillingCosts = tierBillingEntries.map(([tier, units]) => {
        const tierRate = electricRates.residential[year][tier];
        if (tierRate) return tierRate * units;
        else return 0;
    });

    return getArraySum(tierBillingCosts);
}

const findElectricFixedUsageAndDemandRates = (year, season) => {
    let totalFixedCosts = 0;
    let totalDemandCosts = 0;
    let usageBasedCosts = 0;
    let taxedByState = true;
    
    if (electricFormData.customerClass === 'residential') {
        totalFixedCosts += (year === 2024 ? electricRates[electricFormData.customerClass][year].fixed[electricFormData.familyType] : electricRates[electricFormData.customerClass][year].fixed);
        usageBasedCosts += findVariableElectricCost(year, season);
        usageBasedCosts += (year === 2024 ? 0 : electricRates[electricFormData.customerClass][year].publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage);
    } else if (['smallCommercialGS1', 'trafficControlTC1'].includes(electricFormData.customerClass)) {
        // *Note: total cost for Three Phase customer will include Single Phase rate plus Three Phase rate.
        totalFixedCosts += (electricFormData.phaseType === 'singlePhase'
            ? electricRates[electricFormData.customerClass][year].fixed[electricFormData.phaseType]
            : getArraySum(Object.values(electricRates[electricFormData.customerClass][year].fixed)));
        usageBasedCosts += ((year === 2024 && electricFormData.customerClass === 'smallCommercialGS1') 
            ? electricRates[electricFormData.customerClass][year].variable[season] * electricFormData.kWhTotalMonthlyEnergyUsage
            : electricRates[electricFormData.customerClass][year].variable) * electricFormData.kWhTotalMonthlyEnergyUsage;
        usageBasedCosts += (year === 2024 ? 0 : electricRates[electricFormData.customerClass][year].publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage);
    } else if (electricFormData.customerClass === 'mediumCommercialGS2') {
        const customerClassAndYear = electricRates[electricFormData.customerClass][year];
        
        totalFixedCosts += customerClassAndYear.fixed;

        const kWPowerSupplyPeakDemandCost = electricFormData.kWPeakFrom4PMto9PMDemand * customerClassAndYear.kWDemandPowerSupplyPeak;
        const kWDistributionFacilitiesDemandCost = electricFormData.kWFacilitiesRelatedDemand * customerClassAndYear.kwDemandDistributionFacilities;
        const demandCosts = kWPowerSupplyPeakDemandCost + kWDistributionFacilitiesDemandCost;
        
        // **Summer Peak is used for current rates: 4-9 pm during summer months. Peak will be used for proposed rates: 4-9 pm year-round.
        if (year === 2024) {
            totalDemandCosts += (season === 'Summer' ? kWPowerSupplyPeakDemandCost : 0);
            totalDemandCosts +=  kWDistributionFacilitiesDemandCost;
            usageBasedCosts += customerClassAndYear.variable[season] * electricFormData.kWhTotalMonthlyEnergyUsage;
        } else {
            totalDemandCosts += demandCosts;
            usageBasedCosts += customerClassAndYear.variable * electricFormData.kWhTotalMonthlyEnergyUsage;
            usageBasedCosts += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage
        }
    } else if (['largeCommercialTOUGS3', 'industrialTOU8', 'pumpingAndAgriculture'].includes(electricFormData.customerClass)) {
        const isSummer = season === 'Summer';
        const isPumpingAndAgriculture = electricFormData.customerClass === 'pumpingAndAgriculture';
        const customerClassAndYear = electricRates[electricFormData.customerClass][year];

        let kWDemandPowerSupplyPeak = 0;
        let kWDemandDistributionFacilities = 0;

        if (year === 2024 && !isPumpingAndAgriculture) {
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak[season];
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities;
        } else if (year === 2025 && !isSummer && isPumpingAndAgriculture) {
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak.january;
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities.january;
        } else if (year === 2025 && isSummer && isPumpingAndAgriculture) { 
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak.july;
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities.july;
        } else {
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak;
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities;
        }

        const kWPowerSupplyPeakDemandCost = electricFormData.kWPeakFrom4PMto9PMDemand * kWDemandPowerSupplyPeak;
        const kWDistributionFacilitiesDemandCost = electricFormData.kWFacilitiesRelatedDemand * kWDemandDistributionFacilities;
        const kWPeakReactiveDemandCost = electricFormData.kVARReactivePower * customerClassAndYear.powerFactorAdjustment;
        const demandCosts = kWPowerSupplyPeakDemandCost + kWDistributionFacilitiesDemandCost + kWPeakReactiveDemandCost;
        
        totalFixedCosts += customerClassAndYear.fixed;

        if (isSummer) {
            usageBasedCosts += customerClassAndYear.variable.summerOnPeak * electricFormData.kWhSummerOnPeakEnergyUsage; 
            usageBasedCosts += customerClassAndYear.variable.summerMidPeak * electricFormData.kWhSummerMidPeakEnergyUsage; 
            usageBasedCosts += customerClassAndYear.variable.summerOffPeak * electricFormData.kWhSummerOffPeakEnergyUsage; 
        } else {
            usageBasedCosts += customerClassAndYear.variable.winterMidPeak * electricFormData.kWhWinterMidPeakEnergyUsage; 
            usageBasedCosts += customerClassAndYear.variable.winterOffPeak * electricFormData.kWhWinterOffPeakEnergyUsage; 
        }
        
        // ***Summer Peak and Summer Mid-Peak are used for current rates. Peak will be used for proposed rates: 4-9 pm year-round.
        if (year === 2024 && !isPumpingAndAgriculture) {
            totalDemandCosts += (isSummer ? customerClassAndYear.kWDemandPowerSupplyPeak.summerOnPeak * electricFormData.kWSummerOnPeakDemand: 0);
            totalDemandCosts += (isSummer ? customerClassAndYear.kWDemandPowerSupplyPeak.summerMidPeak * electricFormData.kWSummerMidPeakDemand: 0);
            totalDemandCosts += customerClassAndYear.kWDemandDistributionFacilities * electricFormData.kWFacilitiesRelatedDemand;
        } else {
            totalFixedCosts += demandCosts;
            usageBasedCosts += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage;
        }
    } else if (['outdoorAreaLightingAL2', 'streetLightingLS3'].includes(electricFormData.customerClass)) {
        const customerClassAndYear = electricRates[electricFormData.customerClass][year];
        totalFixedCosts += customerClassAndYear.fixed;
        usageBasedCosts += customerClassAndYear.variable * electricFormData.kWhTotalMonthlyEnergyUsage;
        usageBasedCosts += (year === 2024 ? 0 : customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage)
    } else if (electricFormData.customerClass === 'commercialEVChargingRate') {
        if (year !== 2024) {
            const customerClassAndYear = electricRates[electricFormData.customerClass][year];
            
            const kWhEnergyOnPeak4to9PM = customerClassAndYear.kWhEnergyOnPeak4to9PM ? customerClassAndYear.kWhEnergyOnPeak4to9PM : kWhEnergyOnPeak4To9PMEnergyUsageEstimator(season);
            const kWPowerSupplyPeakDemandCost = electricFormData.kWMonthDemandPeak * customerClassAndYear.kWDemandMonth;
            const kWPeakReactiveDemandCost = electricFormData.kVARReactivePower * customerClassAndYear.powerFactorAdjustment;
            const demandCosts = kWPowerSupplyPeakDemandCost + kWPeakReactiveDemandCost;
            
            totalFixedCosts += customerClassAndYear.fixed;

            totalDemandCosts += demandCosts;

            usageBasedCosts += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage;
            usageBasedCosts += kWhEnergyOnPeak4to9PM * electricFormData.kWhEnergyOnPeak4To9PMEnergyUsage;
            usageBasedCosts += customerClassAndYear.kWhEnergyOffPeak * electricFormData.kWhEnergyOffPeak4To9PMEnergyUsage;
        } else taxedByState = false;
    } else return 'No customer class found.';
    
    return { totalFixedCosts, totalDemandCosts, usageBasedCosts, taxedByState };
}

const getElectricRate = (event) => {
    setElectricFormData(event);
    const seasons = ['Winter', 'Summer'];
    
    const winterCosts = [];
    const summerCosts = [];
    
    let seasonIndex = 0;
    while (seasonIndex < seasons.length) {
        const season = seasons[seasonIndex].toLowerCase();
        
        for (let year = 2024; year <= 2029; year++) {
            const { totalFixedCosts, totalDemandCosts, usageBasedCosts, taxedByState } = findElectricFixedUsageAndDemandRates(year, season);
            
            const stateTaxCost = taxedByState ? electricRates.kWhStateTax * electricFormData.kWhTotalMonthlyEnergyUsage : 0;
            
            if (seasonIndex === 0) winterCosts.push(totalFixedCosts + totalDemandCosts + usageBasedCosts + stateTaxCost);
            else summerCosts.push(totalFixedCosts + totalDemandCosts + usageBasedCosts + stateTaxCost);
        }
        
        seasonIndex += 1;
    }

    resetCosts();
    costs.push({ seasons, seasonalCosts: [winterCosts, summerCosts] });

    createTable(true);
}