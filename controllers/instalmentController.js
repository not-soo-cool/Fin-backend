import { Admin } from "../models/adminModel.js";
import { Customer } from "../models/customerModel.js";
import { Instalment } from "../models/instalmentModel.js";
import { Investor } from "../models/investorModel.js";

export const addInstalment = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        const { email, year, month, amount } = req.body;
        const customer = await Customer.findOne({ email });
        const profit = customer.nextMonProfit

        if(amount !== customer.netNextEMI){
            return res.status(400).json({
                success: false,
                message: "Instalment Amount is not correct"
            })
        }

        const date = new Date(customer.nextEMIDate);
        const createdAt = new Date(customer.nextEMIDate);
        const adMon = date.getMonth();
        const adYear = date.getFullYear();

        admin.lifetime.profit = Number(admin.lifetime.profit) + Number(profit);

        admin.current.netWorth = Number(admin.current.netWorth) + Number(profit);
        admin.current.moneyRem = Number(admin.current.moneyRem) + Number(amount);
        // admin.current.currMonInstal = Number(admin.current.currMonInstal) + Number(amount);
        // admin.current.activeProfit = Number(admin.current.activeProfit) + Number(profit);

        if(adMon === 0){
            if(admin.profits.length > Number(adYear) - 2023){
                admin.profits[Number(adYear) - 2023].month[adMon] = Number(admin.profits[Number(adYear) - 2023].month[adMon]) + Number(profit);
            } else {
                admin.profits.push({
                    year: adYear,
                    month: [profit]
                })
            }

            if(admin.receivedInstal.length > Number(adYear) - 2023){
                admin.receivedInstal[Number(adYear) - 2023].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2023].month[adMon]) + Number(amount);
            } else {
                admin.receivedInstal.push({
                    year: adYear,
                    month: [amount]
                })
            }

        } else {
            if(admin.profits[Number(adYear) - 2023].month.length > adMon){
                admin.profits[Number(adYear) - 2023].month[adMon] = Number(admin.profits[Number(adYear) - 2023].month[adMon]) + Number(profit);
            } else {
                admin.profits[Number(adYear) - 2023].month.push(profit)
            }

            if(admin.receivedInstal[Number(adYear) - 2023].month.length > adMon){
                admin.receivedInstal[Number(adYear) - 2023].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2023].month[adMon]) + Number(amount);
            } else {
                admin.receivedInstal[Number(adYear) - 2023].month.push(amount)
            }
        }

        await admin.save();

        admin.current.currMonInstal = admin.receivedInstal[Number(adYear) - 2023].month[adMon];
        admin.current.activeProfit = admin.profits[Number(adYear) - 2023].month[adMon];

        await admin.save();

        if(adMon === 0){
            if(customer.instals.length > Number(adYear) - 2023){
                customer.instals[Number(adYear) - 2023].month[adMon] = Number(customer.instals[Number(adYear) - 2023].month[adMon]) + Number(amount);
            } else {
                customer.instals.push({
                    year: adYear,
                    month: [amount]
                })
            }
        } else {
            if(customer.instals[Number(adYear) - 2023].month.length > adMon){
                customer.instals[Number(adYear) - 2023].month[adMon] = Number(customer.instals[Number(adYear) - 2023].month[adMon]) + Number(amount);
            } else {
                customer.instals[Number(adYear) - 2023].month.push(amount)
            }
        }

        await customer.save();

        let DATE, money=0, prinMoney=0, intMoney=0, netNextEMI=0, nextMonProfit=0, amountDue=0

        // Customer each product iteration
        for (const elem of customer.products){
            if(elem.details.monRem > 0){
                DATE = new Date(elem.details.instalDate);

                // If product's next inst date is for next month only
                if(date.getMonth() === 11){
                    if(DATE.getMonth() === 0 && DATE.getFullYear() === date.getFullYear()+1){
                        netNextEMI = Number(netNextEMI) + Number(elem.finance.emi)
                        nextMonProfit = Number(nextMonProfit) + Number(elem.finance.ipm)
                        amountDue = Number(amountDue) + Number(elem.details.netRem)
                    }
                } else {
                    if(DATE.getMonth() === date.getMonth()+1 && DATE.getFullYear() === date.getFullYear()){
                        netNextEMI = Number(netNextEMI) + Number(elem.finance.emi)
                        nextMonProfit = Number(nextMonProfit) + Number(elem.finance.ipm)
                        amountDue = Number(amountDue) + Number(elem.details.netRem)
                    }
                }

                //***** Main Code *******/

                // All products having current month instalment
                if(date.getMonth() === DATE.getMonth() && date.getFullYear() === DATE.getFullYear()){

                    money = elem.finance.emi;

                    prinMoney = Number(elem.finance.emi) - Number(elem.finance.ipm);

                    intMoney = elem.finance.ipm;

                    // Updating each product details

                    elem.details.netPaid = Number(elem.details.netPaid) + Number(elem.finance.emi);
                    elem.details.netRem = Number(elem.details.netRem) - Number(elem.finance.emi);

                    elem.details.amountPaid = Number(elem.details.amountPaid) + Number(elem.finance.emi) - Number(elem.finance.ipm);
                    elem.details.amountRem = Number(elem.details.amountRem) - Number(elem.finance.emi) + Number(elem.finance.ipm);

                    elem.details.interestPaid = Number(elem.details.interestPaid) + Number(elem.finance.ipm);
                    elem.details.interestRem = Number(elem.details.interestRem) - Number(elem.finance.ipm);

                    elem.details.monRem = Number(elem.details.monRem) - 1
                    elem.details.monComp = Number(elem.details.monComp) + 1

                    if(elem.details.monRem > 0){
                        netNextEMI = Number(netNextEMI) + Number(elem.finance.emi)
                        nextMonProfit = Number(nextMonProfit) + Number(elem.finance.ipm)
                        amountDue = Number(amountDue) + Number(elem.details.netRem)
                    }

                    const investor = await Investor.findById(elem.investor);

                    investor.lifetime.profit = Number(investor.lifetime.profit) + Number(intMoney)

                    investor.current.moneyInvest = Number(investor.current.moneyInvest) - Number(prinMoney)

                    investor.current.moneyRem = Number(investor.current.moneyRem) + Number(money)

                    // investor.current.currMonProfit = Number(investor.current.currMonProfit) + Number(intMoney)

                    investor.current.moneyWorth = Number(investor.current.moneyWorth) + Number(intMoney)

                    if(adMon === 0){
                        if(investor.profits.length > Number(adYear) - 2023){
                            investor.profits[Number(adYear) - 2023].month[adMon] = Number(investor.profits[Number(adYear) - 2023].month[adMon]) + Number(intMoney);
                        } else {
                            investor.profits.push({
                                year: adYear,
                                month: [intMoney]
                            })
                        }

                        if(investor.amounts.length > Number(adYear) - 2023){
                            investor.amounts[Number(adYear) - 2023].month[adMon] = Number(investor.amounts[Number(adYear) - 2023].month[adMon]) + Number(money);
                        } else {
                            investor.amounts.push({
                                year: adYear,
                                month: [money]
                            })
                        }

                    } else {
                        if(investor.profits[Number(adYear) - 2023].month.length > adMon){
                            investor.profits[Number(adYear) - 2023].month[adMon] = Number(investor.profits[Number(adYear) - 2023].month[adMon]) + Number(intMoney);
                        } else {
                            investor.profits[Number(adYear) - 2023].month.push(intMoney)
                        }

                        if(investor.amounts[Number(adYear) - 2023].month.length > adMon){
                            investor.amounts[Number(adYear) - 2023].month[adMon] = Number(investor.amounts[Number(adYear) - 2023].month[adMon]) + Number(money);
                        } else {
                            investor.amounts[Number(adYear) - 2023].month.push(money)
                        }
                    }
                    await investor.save();

                    investor.current.currMonProfit = investor.profits[Number(adYear) - 2023].month[adMon];

                    if(adMon === 11){
                        DATE.setMonth(0);
                        DATE.setFullYear(adYear+1);
                    } else {
                        DATE.setMonth(adMon+1)
                    }
                    DATE.setDate(process.env.INST_DATE);
                    DATE.setHours(23);
                    DATE.setMinutes(59);
                    DATE.setSeconds(59);

                    elem.details.instalDate = DATE.toISOString();
                }
            }
        }

        date.setMonth(date.getMonth()+1);
        date.setDate(process.env.INST_DATE);
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);

        customer.nextEMIDate = date.toISOString();

        const expecAmount = customer.netNextEMI
        const expecProfit = customer.nextMonProfit

        // const val = Number(customer.penalty) - Number(customer.buffer)
        customer.nextMonProfit = nextMonProfit
        customer.netNextEMI = netNextEMI
        customer.amountDue = Number(amountDue)

        const instalment = await Instalment.create({
            customer: customer._id,
            year,
            month,
            amount,
            expecAmount,
            profit,
            expecProfit,
            createdAt,
        });

        customer.instalment.unshift(instalment._id);
        customer.inProgress = true;
        
        await customer.save();

        // let pen=0;
        for(const elem of customer.products){
            if(elem.details.monRem === 0){
                const investor = await Investor.findById(elem.investor);

                // if(elem.details.netRem !== 0){
                //     pen = Number(pen) + Number(elem.details.netRem);
                //     elem.details.netPaid = Number(elem.details.netPaid) + Number(elem.details.netRem)
                //     elem.details.netRem = 0
                //     elem.details.amountPaid = Number(elem.details.amountPaid) + Number(elem.details.amountRem)
                //     elem.details.amountRem = 0
                //     elem.details.interestPaid = Number(elem.details.interestPaid) + Number(elem.details.interestRem)
                //     elem.details.interestRem = 0
                // }
                if(customer.amountDue !== 0){
                    customer.amountDue = 0;
                    elem.details.netRem = 0;
                    elem.details.amountRem = 0;
                    elem.details.interestRem = 0;
                    await customer.save();
                }

                investor.current.currMoney = Number(investor.current.currMoney) - Number(elem.finance.finAmount)
                admin.current.activeInvest = Number(admin.current.activeInvest) - Number(elem.finance.finAmount)
                elem.details.nextEMI = 0;
                await investor.save();
                await admin.save();
            }
        }

        await customer.save();
        
        admin.instalHistory.unshift(instalment._id);
        await admin.save();

        res.status(201).json({
            success: true,
            message: "Instalment added successfully"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// export const addInstalment = async(req, res) => {
//     try {
//         const admin = await Admin.findById(req.admin._id);

//         const { email, year, month, amount } = req.body;
//         const customer = await Customer.findOne({ email });

//         const date = new Date(customer.nextEMIDate);

//         // Calculating received profit
//         const adProfit = Number(Number(amount*customer.nextMonProfit)/Number(customer.netNextEMI)).toFixed(2);
//         const adMon = date.getMonth();
//         const adYear = date.getFullYear();

//         // Updating admin with all details
//         admin.lifetime.profit = Number(admin.lifetime.profit) + Number(adProfit);

//         admin.current.netWorth = Number(admin.current.netWorth) + Number(adProfit);
//         admin.current.moneyRem = Number(admin.current.moneyRem) + Number(amount);
//         admin.current.currMonInstal = Number(admin.current.currMonInstal) + Number(amount);
//         admin.current.activeProfit = Number(admin.current.activeProfit) + Number(adProfit);

//         if(adMon === 0){
//             if(admin.profits.length > Number(adYear) - 2024){
//                 admin.profits[Number(adYear) - 2024].month[adMon] = Number(admin.profits[Number(adYear) - 2024].month[adMon]) + Number(adProfit);
//             } else {
//                 admin.profits.push({
//                     year: adYear,
//                     month: [adProfit]
//                 })
//             }

//             if(admin.receivedInstal.length > Number(adYear) - 2024){
//                 admin.receivedInstal[Number(adYear) - 2024].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2024].month[adMon]) + Number(amount);
//             } else {
//                 admin.receivedInstal.push({
//                     year: adYear,
//                     month: [amount]
//                 })
//             }

//         } else {
//             if(admin.profits[Number(adYear) - 2024].month.length > adMon){
//                 admin.profits[Number(adYear) - 2024].month[adMon] = Number(admin.profits[Number(adYear) - 2024].month[adMon]) + Number(adProfit);
//             } else {
//                 admin.profits[Number(adYear) - 2024].month.push(adProfit)
//             }

//             if(admin.receivedInstal[Number(adYear) - 2024].month.length > adMon){
//                 admin.receivedInstal[Number(adYear) - 2024].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2024].month[adMon]) + Number(amount);
//             } else {
//                 admin.receivedInstal[Number(adYear) - 2024].month.push(amount)
//             }
//         }

//         await admin.save();

//         // Defining penalty
//         const num = Number(customer.netNextEMI) - Number(amount) - Number(customer.buffer) + Number(customer.penalty);
//         if(num > 0){
//             customer.penalty = num;
//             customer.buffer = 0;
//         } else {
//             customer.penalty = 0;
//             customer.buffer = 0 - num;
//         }

//         let DATE, money=0, prinMoney=0, intMoney=0, netNextEMI=0, nextMonProfit=0, amountDue=0

//         // Customer each product iteration
//         for (const elem of customer.products) {
//             if(elem.details.monRem > 0){
//                 DATE = new Date(elem.details.instalDate);

//                 // If product's next inst date is for next month only
//                 if(date.getMonth() === 11){
//                     if(DATE.getMonth() === 0 && DATE.getFullYear() === date.getFullYear()+1){
//                         netNextEMI = Number(netNextEMI) + Number(elem.finance.emi)
//                         nextMonProfit = Number(nextMonProfit) + Number(elem.finance.ipm)
//                         amountDue = Number(amountDue) + Number(elem.details.netRem)
//                     }
//                 } else {
//                     if(DATE.getMonth() === date.getMonth()+1 && DATE.getFullYear() === date.getFullYear()){
//                         netNextEMI = Number(netNextEMI) + Number(elem.finance.emi)
//                         console.log("Pro3: ", nextMonProfit)
//                         nextMonProfit = Number(nextMonProfit) + Number(elem.finance.ipm)
//                         amountDue = Number(amountDue) + Number(elem.details.netRem)
//                     }
//                 }

//                 //***** Main Code *******/

//                 // All products having current month instalment
//                 if(date.getMonth() === DATE.getMonth() && date.getFullYear() === DATE.getFullYear()){

//                     money = Number(Number(amount*elem.finance.emi)/Number(customer.netNextEMI)).toFixed(2);

//                     prinMoney = Number(Number(amount*elem.finance.finAmount)/Number(elem.finance.month*customer.netNextEMI)).toFixed(2);

//                     intMoney = Number(Number(money) - Number(prinMoney)).toFixed(2);

//                     // Updating each product details

//                     // elem.details.netPaid = Number(elem.details.netPaid) + Number(money);
//                     // elem.details.netRem = Number(elem.details.netRem) - Number(money);
//                     elem.details.netPaid = Number(elem.details.netPaid) + Number(elem.finance.emi);
//                     elem.details.netRem = Number(elem.details.netRem) - Number(elem.finance.emi);

//                     // elem.details.amountPaid = Number(elem.details.amountPaid) + Number(prinMoney);
//                     // elem.details.amountRem = Number(elem.details.amountRem) - Number(prinMoney);

//                     elem.details.amountPaid = Number(elem.details.amountPaid) + Number(elem.finance.emi) - Number(elem.finance.ipm);
//                     elem.details.amountRem = Number(elem.details.amountRem) - Number(elem.finance.emi) + Number(elem.finance.ipm);

//                     // elem.details.interestPaid = Number(elem.details.interestPaid) + Number(intMoney);
//                     // elem.details.interestRem = Number(elem.details.interestRem) - Number(intMoney);

//                     elem.details.interestPaid = Number(elem.details.interestPaid) + Number(elem.finance.ipm);
//                     elem.details.interestRem = Number(elem.details.interestRem) - Number(elem.finance.ipm);

//                     elem.details.monRem = Number(elem.details.monRem) - 1
//                     elem.details.monComp = Number(elem.details.monComp) + 1

//                     if(elem.details.monRem > 0){
//                         netNextEMI = Number(netNextEMI) + Number(elem.finance.emi)
//                         nextMonProfit = Number(nextMonProfit) + Number(elem.finance.ipm)
//                         amountDue = Number(amountDue) + Number(elem.details.netRem)
//                     }

//                     const investor = await Investor.findById(elem.investor);

//                     investor.lifetime.profit = Number(investor.lifetime.profit) + Number(intMoney)

//                     investor.current.moneyInvest = Number(investor.current.moneyInvest) - Number(prinMoney)

//                     investor.current.moneyRem = Number(investor.current.moneyRem) + Number(prinMoney)

//                     investor.current.currMonProfit = Number(investor.current.currMonProfit) + Number(intMoney)

//                     investor.current.moneyWorth = Number(investor.current.moneyWorth) + Number(intMoney)

//                     const m = date.getMonth();
//                     const y = date.getFullYear();

//                     if(m === 0){
//                         if(investor.profits.length > Number(y) - 2024){
//                             investor.profits[Number(y) - 2024].month[m] = Number(investor.profits[Number(y) - 2024].month[m]) + Number(intMoney);
//                         } else {
//                             investor.profits.push({
//                                 year: y,
//                                 month: [intMoney]
//                             })
//                         }

//                         if(investor.amounts.length > Number(y) - 2024){
//                             investor.amounts[Number(y) - 2024].month[m] = Number(investor.amounts[Number(y) - 2024].month[m]) + Number(money);
//                         } else {
//                             investor.amounts.push({
//                                 year: y,
//                                 month: [money]
//                             })
//                         }

//                     } else {
//                         if(investor.profits[Number(y) - 2024].month.length > m){
//                             investor.profits[Number(y) - 2024].month[m] = Number(investor.profits[Number(y) - 2024].month[m]) + Number(intMoney);
//                         } else {
//                             investor.profits[Number(y) - 2024].month.push(intMoney)
//                         }

//                         if(investor.amounts[Number(y) - 2024].month.length > m){
//                             investor.amounts[Number(y) - 2024].month[m] = Number(investor.amounts[Number(y) - 2024].month[m]) + Number(money);
//                         } else {
//                             investor.amounts[Number(y) - 2024].month.push(money)
//                         }
//                     }
//                     await investor.save();

//                     if(adMon === 11){
//                         DATE.setMonth(0);
//                         DATE.setFullYear(adYear+1);
//                     } else {
//                         DATE.setMonth(adMon+1)
//                     }
//                     DATE.setDate(process.env.INST_DATE);
//                     DATE.setHours(23);
//                     DATE.setMinutes(59);
//                     DATE.setSeconds(59);

//                     elem.details.instalDate = DATE.toISOString();
//                 }
//             }
//         };

//         date.setMonth(date.getMonth()+1);
//         date.setDate(process.env.INST_DATE);
//         date.setHours(23);
//         date.setMinutes(59);
//         date.setSeconds(59);

//         customer.nextEMIDate = date.toISOString();

//         const profit = Number(Number(amount*customer.nextMonProfit)/Number(customer.netNextEMI)).toFixed(2);
//         const expecAmount = customer.netNextEMI
//         const expecProfit = customer.nextMonProfit

//         const val = Number(customer.penalty) - Number(customer.buffer)
//         customer.nextMonProfit = nextMonProfit
//         customer.netNextEMI = netNextEMI
//         customer.amountDue = Number(amountDue) + Number(val)

//         const instalment = await Instalment.create({
//             customer: customer._id,
//             year,
//             month,
//             amount,
//             expecAmount,
//             profit,
//             expecProfit
//         });

//         // customer.amountDue = Number(customer.amountDue) - Number(amount);

//         customer.instalment.unshift(instalment._id);
        
//         await customer.save();

//         let pen=0;
//         for(const elem of customer.products){
//             if(elem.details.monRem === 0){
//                 const investor = await Investor.findById(elem.investor);

//                 if(elem.details.netRem !== 0){
//                     pen = Number(pen) + Number(elem.details.netRem);
//                     elem.details.netPaid = Number(elem.details.netPaid) + Number(elem.details.netRem)
//                     elem.details.netRem = 0
//                     elem.details.amountPaid = Number(elem.details.amountPaid) + Number(elem.details.amountRem)
//                     elem.details.amountRem = 0
//                     elem.details.interestPaid = Number(elem.details.interestPaid) + Number(elem.details.interestRem)
//                     elem.details.interestRem = 0
//                 }

//                 investor.current.currMoney = Number(investor.current.currMoney) - Number(elem.finance.finAmount)
//                 elem.details.nextEMI = 0;
//             }
//         }

//         await customer.save();
        
//         admin.instalHistory.unshift(instalment._id);
//         await admin.save();

//         res.status(201).json({
//             success: true,
//             message: "Instalment added successfully"
//         });
        
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

export const getAllInstalments = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        if(!admin){
            res.status(404).json({
                success: false,
                message: "Admin not logged in"
            })
        }

        const instalments = await Instalment.find().populate("customer");

        res.status(200).json({
            success: true,
            instalments: instalments.reverse()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getUserInstalments = async(req, res) => {
    try {

        const customer = await Customer.findById(req.params.id);
        if(!customer){
            res.status(404).json({
                success: false,
                message: "Investor not found"
            })
        }

        const instalments = await Instalment.find({ 'customer': req.params.id }).populate("customer");

        res.status(200).json({
            success: true,
            instalments
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getInstalment = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        if(!admin){
            res.status(404).json({
                success: false,
                message: "Admin not logged in"
            })
        }

        const instalment = await Instalment.findById(req.params.id).populate("customer");

        res.status(200).json({
            success: true,
            instalment
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

