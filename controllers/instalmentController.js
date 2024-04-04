import { Admin } from "../models/adminModel.js";
import { Customer } from "../models/customerModel.js";
import { Instalment } from "../models/instalmentModel.js";
import { Investor } from "../models/investorModel.js";
import { Notification } from "../models/notificationModel.js";

export const addInstalment = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        const { email, year, month, received, checked } = req.body;
        const customer = await Customer.findOne({ email });

        const amount = received - customer.penalty
        const notSame = amount !== customer.netNextEMI
        const profit = notSame ? Number(customer.nextMonProfit*amount)/Number(customer.netNextEMI) : customer.nextMonProfit
        const penalty = customer.penalty;
        customer.penalty = 0;

        const today = new Date(Date.now());
        const date = new Date(customer.nextEMIDate);
        const createdAt = new Date(customer.nextEMIDate);
        if(today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear() && today.getDate() > date.getDate()){
            if(checked){
                customer.penalty = 500
                await customer.save();
            }
        }
        const adMon = date.getMonth();
        const adYear = date.getFullYear();

        admin.lifetime.profit = Number(admin.lifetime.profit) + Number(profit) + Number(penalty);

        admin.current.netWorth = Number(admin.current.netWorth) + Number(profit) + Number(penalty);
        admin.current.moneyRem = Number(admin.current.moneyRem) + Number(amount) + Number(penalty);

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
                admin.receivedInstal[Number(adYear) - 2023].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2023].month[adMon]) + Number(amount) + Number(penalty);
            } else {
                admin.receivedInstal.push({
                    year: adYear,
                    month: [Number(amount) + Number(penalty)]
                })
            }

            if(penalty !== 0){
                if(admin.penalty.length > Number(adYear) - 2024){
                    admin.penalty[Number(adYear) - 2024].month[adMon] = Number(admin.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                } else {
                    admin.penalty.push({
                        year: adYear,
                        month: [penalty]
                    })
                }
            }

        } else {
            if(admin.profits[Number(adYear) - 2023].month.length > adMon){
                admin.profits[Number(adYear) - 2023].month[adMon] = Number(admin.profits[Number(adYear) - 2023].month[adMon]) + Number(profit);
            } else {
                admin.profits[Number(adYear) - 2023].month.push(profit)
            }

            if(admin.receivedInstal[Number(adYear) - 2023].month.length > adMon){
                admin.receivedInstal[Number(adYear) - 2023].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2023].month[adMon]) + Number(amount) + Number(penalty);
            } else {
                admin.receivedInstal[Number(adYear) - 2023].month.push(Number(amount) + Number(penalty))
            }

            if(penalty !== 0){
                if(admin.penalty[Number(adYear) - 2024].month.length > adMon){
                    admin.penalty[Number(adYear) - 2024].month[adMon] = Number(admin.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                } else {
                    while(admin.penalty[Number(adYear) - 2024].month.length < adMon){
                        admin.penalty[Number(adYear) - 2024].month.push(0);
                    }
                    admin.penalty[Number(adYear) - 2024].month.push(penalty)
                }
            }
        }

        await admin.save();

        admin.current.currMonInstal = admin.receivedInstal[Number(adYear) - 2023].month[adMon];
        admin.current.activeProfit = admin.profits[Number(adYear) - 2023].month[adMon];

        await admin.save();

        const custYear = customer.instals[0].year;
        // const custYear = today.getFullYear();
        if(adMon === 0){
            if(customer.instals.length > Number(adYear) - Number(custYear)){
                customer.instals[Number(adYear) - Number(custYear)].month[adMon] = Number(customer.instals[Number(adYear) - Number(custYear)].month[adMon]) + Number(amount) + Number(penalty);
            } else {
                customer.instals.push({
                    year: adYear,
                    month: [Number(amount) + Number(penalty)]
                })
            }
        } else {
            if(customer.instals[Number(adYear) - Number(custYear)].month.length > adMon){
                customer.instals[Number(adYear) - Number(custYear)].month[adMon] = Number(customer.instals[Number(adYear) - Number(custYear)].month[adMon]) + Number(amount) + Number(penalty);
            } else {
                customer.instals[Number(adYear) - Number(custYear)].month.push(Number(amount) + Number(penalty))
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

                    money = notSame ? amount : customer.netNextEMI;

                    prinMoney = notSame ? Number(Number(elem.finance.emi) - Number(elem.finance.ipm))*amount/Number(elem.finance.emi) : Number(customer.netNextEMI) - Number(customer.nextMonProfit);

                    intMoney = notSame ? Number(elem.finance.ipm*amount)/Number(elem.finance.emi) : customer.nextMonProfit;

                    // Updating each product details

                    elem.details.netPaid = Number(elem.details.netPaid) + Number(money);
                    elem.details.netRem = Number(elem.details.netRem) - Number(money);

                    elem.details.amountPaid = Number(elem.details.amountPaid) + prinMoney;
                    elem.details.amountRem = Number(elem.details.amountRem) - prinMoney;

                    elem.details.interestPaid = Number(elem.details.interestPaid) + intMoney;
                    elem.details.interestRem = Number(elem.details.interestRem) - intMoney;

                    elem.details.monRem = Number(elem.details.monRem) - 1
                    elem.details.monComp = Number(elem.details.monComp) + 1

                    if(elem.details.monRem > 0){
                        netNextEMI = Number(netNextEMI) + Number(customer.netNextEMI) + Number(elem.finance.emi) - Number(money)
                        nextMonProfit = Number(nextMonProfit) + Number(customer.nextMonProfit) + Number(elem.finance.ipm) - Number(intMoney)
                        amountDue = Number(amountDue) + Number(elem.details.netRem)
                    }

                    const investor = await Investor.findById(elem.investor);

                    investor.lifetime.profit = Number(investor.lifetime.profit) + Number(intMoney)

                    investor.current.moneyInvest = Number(investor.current.moneyInvest) - Number(prinMoney)

                    investor.current.moneyRem = Number(investor.current.moneyRem) + Number(money) + Number(penalty)

                    investor.current.moneyWorth = Number(investor.current.moneyWorth) + Number(intMoney) + Number(penalty)

                    const invYear = investor.profits[0].year;
                    if(adMon === 0){
                        if(investor.profits.length > Number(adYear) - Number(invYear)){
                            investor.profits[Number(adYear) - Number(invYear)].month[adMon] = Number(investor.profits[Number(adYear) - Number(invYear)].month[adMon]) + Number(intMoney);
                        } else {
                            investor.profits.push({
                                year: adYear,
                                month: [intMoney]
                            })
                        }

                        if(investor.amounts.length > Number(adYear) - Number(invYear)){
                            investor.amounts[Number(adYear) - Number(invYear)].month[adMon] = Number(investor.amounts[Number(adYear) - Number(invYear)].month[adMon]) + Number(money) + Number(penalty);
                        } else {
                            investor.amounts.push({
                                year: adYear,
                                month: [Number(money) + Number(penalty)]
                            })
                        }

                        if(penalty !== 0){
                            if(investor.penalty.length > Number(adYear) - 2024){
                                investor.penalty[Number(adYear) - 2024].month[adMon] = Number(investor.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                            } else {
                                investor.penalty.push({
                                    year: adYear,
                                    month: [penalty]
                                })
                            }
                        }
                    } else {
                        if(investor.profits[Number(adYear) - Number(invYear)].month.length > adMon){
                            investor.profits[Number(adYear) - Number(invYear)].month[adMon] = Number(investor.profits[Number(adYear) - Number(invYear)].month[adMon]) + Number(intMoney);
                        } else {
                            investor.profits[Number(adYear) - Number(invYear)].month.push(intMoney)
                        }

                        if(investor.amounts[Number(adYear) - Number(invYear)].month.length > adMon){
                            investor.amounts[Number(adYear) - Number(invYear)].month[adMon] = Number(investor.amounts[Number(adYear) - Number(invYear)].month[adMon]) + Number(money) + Number(penalty);
                        } else {
                            investor.amounts[Number(adYear) - Number(invYear)].month.push(Number(money) + Number(penalty))
                        }

                        if(penalty !== 0){
                            if(investor.penalty[Number(adYear) - 2024].month.length > adMon){
                                investor.penalty[Number(adYear) - 2024].month[adMon] = Number(investor.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                            } else {
                                while(investor.penalty[Number(adYear) - 2024].month.length < adMon){
                                    investor.penalty[Number(adYear) - 2024].month.push(0);
                                }
                                investor.penalty[Number(adYear) - 2024].month.push(penalty)
                            }
                        }
                    }
                    await investor.save();

                    investor.current.currMonProfit = investor.profits[Number(today.getFullYear()) - Number(invYear)].month[today.getMonth()];

                    let prevMon=0, prevYear=0;
                    if(today.getMonth()===0){
                        prevMon = 11;
                        prevYear = today.getFullYear()-1;
                    } else {
                        prevMon = today.getMonth()-1;
                        prevYear = today.getFullYear();
                    }

                    investor.current.prevMonProfit = investor.profits[Number(prevYear) - Number(invYear)].month[prevMon];

                    await investor.save();

                    if(adMon === 11){
                        DATE.setMonth(0);
                        DATE.setFullYear(adYear+1);
                    } else {
                        DATE.setMonth(adMon+1)
                    }
                    DATE.setDate(process.env.INST_DATE);
                    DATE.setHours(23);
                    DATE.setMinutes(55);
                    DATE.setSeconds(59);

                    elem.details.instalDate = DATE.toISOString();
                }
            }
        }

        if(adMon === 11){
            date.setMonth(0);
            date.setFullYear(adYear+1);
        } else {
            date.setMonth(adMon+1)
        }
        // date.setMonth(date.getMonth()+1);
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
            amount: received,
            expecAmount,
            profit,
            expecProfit,
            createdAt,
        });

        const notification = await Notification.create({
            notName: "Instalment Added",
            name: customer.name,
            createdAt: Date.now(),
            amount: received,
            year,
            month
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
                    customer.netNextEMI = 0;
                    customer.nextMonProfit = 0;
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


// Extras
export const testInstal = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        const { email, year, month, received, checked } = req.body;
        const customer = await Customer.findOne({ email });
        // if(received === Number(customer.netNextEMI) + Number(customer.penalty) && checked){
        //     return res.status(400).json({
        //         success: false,
        //         message: "Can't do this"
        //     })
        // }
        const amount = received - customer.penalty
        const notSame = amount !== customer.netNextEMI
        const profit = notSame ? Number(customer.nextMonProfit*amount)/Number(customer.netNextEMI) : customer.nextMonProfit
        const penalty = customer.penalty;
        customer.penalty = 0;
        let takePenalty = false;

        // if(amount !== customer.netNextEMI){
        //     return res.status(400).json({
        //         success: false,
        //         message: "Instalment Amount is not correct"
        //     })
        // }

        const today = new Date(Date.now());
        const date = new Date(customer.nextEMIDate);
        const createdAt = new Date(customer.nextEMIDate);
        if(today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() > date.getDate()){
            if(checked){
                takePenalty = true;
                customer.penalty = 500
                await customer.save();
            }
        }
        const adMon = date.getMonth();
        const adYear = date.getFullYear();

        // admin.lifetime.profit = Number(admin.lifetime.profit) + Number(profit) + Number(penalty);

        // admin.current.netWorth = Number(admin.current.netWorth) + Number(profit) + Number(penalty);
        // admin.current.moneyRem = Number(admin.current.moneyRem) + Number(amount) + Number(penalty);

        if(adMon === 0){
            // if(admin.profits.length > Number(adYear) - 2023){
            //     admin.profits[Number(adYear) - 2023].month[adMon] = Number(admin.profits[Number(adYear) - 2023].month[adMon]) + Number(profit);
            // } else {
            //     admin.profits.push({
            //         year: adYear,
            //         month: [profit]
            //     })
            // }

            // if(admin.receivedInstal.length > Number(adYear) - 2023){
            //     admin.receivedInstal[Number(adYear) - 2023].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2023].month[adMon]) + Number(amount) + Number(penalty);
            // } else {
            //     admin.receivedInstal.push({
            //         year: adYear,
            //         month: [Number(amount) + Number(penalty)]
            //     })
            // }

            if(penalty !== 0){
                if(admin.penalty.length > Number(adYear) - 2024){
                    admin.penalty[Number(adYear) - 2024].month[adMon] = Number(admin.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                } else {
                    admin.penalty.push({
                        year: adYear,
                        month: [penalty]
                    })
                }
            }

        } else {
            // if(admin.profits[Number(adYear) - 2023].month.length > adMon){
            //     admin.profits[Number(adYear) - 2023].month[adMon] = Number(admin.profits[Number(adYear) - 2023].month[adMon]) + Number(profit);
            // } else {
            //     admin.profits[Number(adYear) - 2023].month.push(profit)
            // }

            // if(admin.receivedInstal[Number(adYear) - 2023].month.length > adMon){
            //     admin.receivedInstal[Number(adYear) - 2023].month[adMon] = Number(admin.receivedInstal[Number(adYear) - 2023].month[adMon]) + Number(amount) + Number(penalty);
            // } else {
            //     admin.receivedInstal[Number(adYear) - 2023].month.push(Number(amount) + Number(penalty))
            // }

            if(penalty !== 0){
                if(admin.penalty[Number(adYear) - 2024].month.length > adMon){
                    admin.penalty[Number(adYear) - 2024].month[adMon] = Number(admin.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                } else {
                    while(admin.penalty[Number(adYear) - 2024].month.length < adMon){
                        admin.penalty[Number(adYear) - 2024].month.push(0);
                    }
                    admin.penalty[Number(adYear) - 2024].month.push(penalty)
                }
            }
        }

        await admin.save();

        // admin.current.currMonInstal = admin.receivedInstal[Number(adYear) - 2023].month[adMon];
        // admin.current.activeProfit = admin.profits[Number(adYear) - 2023].month[adMon];

        // await admin.save();

        // if(adMon === 0){
        //     if(customer.instals.length > Number(adYear) - 2023){
        //         customer.instals[Number(adYear) - 2023].month[adMon] = Number(customer.instals[Number(adYear) - 2023].month[adMon]) + Number(amount) + Number(penalty);
        //     } else {
        //         customer.instals.push({
        //             year: adYear,
        //             month: [Number(amount) + Number(penalty)]
        //         })
        //     }
        // } else {
        //     if(customer.instals[Number(adYear) - 2023].month.length > adMon){
        //         customer.instals[Number(adYear) - 2023].month[adMon] = Number(customer.instals[Number(adYear) - 2023].month[adMon]) + Number(amount) + Number(penalty);
        //     } else {
        //         customer.instals[Number(adYear) - 2023].month.push(Number(amount) + Number(penalty))
        //     }
        // }

        // await customer.save();

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

                    money = notSame ? amount : customer.netNextEMI;

                    prinMoney = notSame ? Number(Number(elem.finance.emi) - Number(elem.finance.ipm))*amount/Number(elem.finance.emi) : Number(customer.netNextEMI) - Number(customer.nextMonProfit);

                    intMoney = notSame ? Number(elem.finance.ipm*amount)/Number(elem.finance.emi) : customer.nextMonProfit;

                    // Updating each product details

                    elem.details.netPaid = Number(elem.details.netPaid) + Number(money);
                    elem.details.netRem = Number(elem.details.netRem) - Number(money);

                    elem.details.amountPaid = Number(elem.details.amountPaid) + prinMoney;
                    elem.details.amountRem = Number(elem.details.amountRem) - prinMoney;

                    elem.details.interestPaid = Number(elem.details.interestPaid) + intMoney;
                    elem.details.interestRem = Number(elem.details.interestRem) - intMoney;

                    elem.details.monRem = Number(elem.details.monRem) - 1
                    elem.details.monComp = Number(elem.details.monComp) + 1

                    if(elem.details.monRem > 0){
                        netNextEMI = Number(netNextEMI) + Number(customer.netNextEMI) + Number(elem.finance.emi) - Number(money)
                        nextMonProfit = Number(nextMonProfit) + Number(customer.nextMonProfit) + Number(elem.finance.ipm) - Number(intMoney)
                        amountDue = Number(amountDue) + Number(elem.details.netRem)
                    }

                    const investor = await Investor.findById(elem.investor);

                    // investor.lifetime.profit = Number(investor.lifetime.profit) + Number(intMoney)

                    // investor.current.moneyInvest = Number(investor.current.moneyInvest) - Number(prinMoney)

                    // investor.current.moneyRem = Number(investor.current.moneyRem) + Number(money) + Number(penalty)

                    // investor.current.moneyWorth = Number(investor.current.moneyWorth) + Number(intMoney) + Number(penalty)

                    if(adMon === 0){
                        // if(investor.profits.length > Number(adYear) - 2023){
                        //     investor.profits[Number(adYear) - 2023].month[adMon] = Number(investor.profits[Number(adYear) - 2023].month[adMon]) + Number(intMoney);
                        // } else {
                        //     investor.profits.push({
                        //         year: adYear,
                        //         month: [intMoney]
                        //     })
                        // }

                        // if(investor.amounts.length > Number(adYear) - 2023){
                        //     investor.amounts[Number(adYear) - 2023].month[adMon] = Number(investor.amounts[Number(adYear) - 2023].month[adMon]) + Number(money) + Number(penalty);
                        // } else {
                        //     investor.amounts.push({
                        //         year: adYear,
                        //         month: [Number(money) + Number(penalty)]
                        //     })
                        // }

                        if(penalty !== 0){
                            if(investor.penalty.length > Number(adYear) - 2024){
                                investor.penalty[Number(adYear) - 2024].month[adMon] = Number(investor.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                            } else {
                                investor.penalty.push({
                                    year: adYear,
                                    month: [penalty]
                                })
                            }
                        }

                    } else {
                        // if(investor.profits[Number(adYear) - 2023].month.length > adMon){
                        //     investor.profits[Number(adYear) - 2023].month[adMon] = Number(investor.profits[Number(adYear) - 2023].month[adMon]) + Number(intMoney);
                        // } else {
                        //     investor.profits[Number(adYear) - 2023].month.push(intMoney)
                        // }

                        // if(investor.amounts[Number(adYear) - 2023].month.length > adMon){
                        //     investor.amounts[Number(adYear) - 2023].month[adMon] = Number(investor.amounts[Number(adYear) - 2023].month[adMon]) + Number(money) + Number(penalty);
                        // } else {
                        //     investor.amounts[Number(adYear) - 2023].month.push(Number(money) + Number(penalty))
                        // }

                        if(penalty !== 0){
                            if(investor.penalty[Number(adYear) - 2024].month.length > adMon){
                                investor.penalty[Number(adYear) - 2024].month[adMon] = Number(investor.penalty[Number(adYear) - 2024].month[adMon]) + Number(penalty);
                            } else {
                                while(investor.penalty[Number(adYear) - 2024].month.length < adMon){
                                    investor.penalty[Number(adYear) - 2024].month.push(0);
                                }
                                investor.penalty[Number(adYear) - 2024].month.push(penalty)
                            }
                        }
                    }
                    await investor.save();

                    // investor.current.currMonProfit = investor.profits[Number(date.getFullYear()) - 2023].month[date.getMonth()];

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

        if(adMon === 11){
            date.setMonth(0);
            date.setFullYear(adYear+1);
        } else {
            date.setMonth(adMon+1)
        }
        // date.setMonth(date.getMonth()+1);
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

        // const instalment = await Instalment.create({
        //     customer: customer._id,
        //     year,
        //     month,
        //     amount: received,
        //     expecAmount,
        //     profit,
        //     expecProfit,
        //     createdAt,
        // });

        // customer.instalment.unshift(instalment._id);
        customer.inProgress = true;
        
        await customer.save();

        const notification = await Notification.create({
            notName: "Instalment Added",
            name: customer.name,
            createdAt: Date.now(),
            amount: received,
            year,
            month
        });

        // let pen=0;
        for(const elem of customer.products){
            if(elem.details.monRem === 0){
                const investor = await Investor.findById(elem.investor);

                if(customer.amountDue !== 0){
                    customer.amountDue = 0;
                    customer.netNextEMI = 0;
                    customer.nextMonProfit = 0;
                    elem.details.netRem = 0;
                    elem.details.amountRem = 0;
                    elem.details.interestRem = 0;
                    await customer.save();
                }

                // investor.current.currMoney = Number(investor.current.currMoney) - Number(elem.finance.finAmount)
                // admin.current.activeInvest = Number(admin.current.activeInvest) - Number(elem.finance.finAmount)
                elem.details.nextEMI = 0;
                // await investor.save();
                // await admin.save();
            }
        }

        await customer.save();
        
        // admin.instalHistory.unshift(instalment._id);
        // await admin.save();

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

