import Image from "next/image";
import { v4 as uuid } from "uuid";
import logo from "../public/kudavasal.svg";
import { FaCoins, FaSackDollar, FaUserGroup, FaUsers } from "react-icons/fa6";
import { BsCoin } from "react-icons/bs";
import { GrTransaction } from "react-icons/gr";
/**
 *  All Dashboard Routes
 *
 *  Understanding name/value pairs for Dashboard routes
 *
 *  Applicable for main/root/level 1 routes
 *  icon 		: String - It's only for main menu or you can consider 1st level menu item to specify icon name.
 *
 *  Applicable for main/root/level 1 and subitems routes
 * 	id 			: Number - You can use uuid() as value to generate unique ID using uuid library, you can also assign constant unique ID for react dynamic objects.
 *  title 		: String - If menu contains childern use title to provide main menu name.
 *  badge 		: String - (Optional - Default - '') If you specify badge value it will be displayed beside the menu title or menu item.
 * 	badgecolor 	: String - (Optional - Default - 'primary' ) - Used to specify badge background color.
 *
 *  Applicable for subitems / children items routes
 *  name 		: String - If it's menu item in which you are specifiying link, use name ( don't use title for that )
 *  children	: Array - Use to specify submenu items
 *
 *  Used to segrigate menu groups
 *  grouptitle : Boolean - (Optional - Default - false ) If you want to group menu items you can use grouptitle = true,
 *  ( Use title : value to specify group title  e.g. COMPONENTS , DOCUMENTATION that we did here. )
 *
 */

export const DashboardMenu = [
  {
    id: uuid(),
    title: "Pair Ever",

    link: "/dashboard",
  },
  {
    id: uuid(),
    title: "Dashboard",
    icon: "home",
    link: "/dashboard",
  },


  {
    id: uuid(),
    title: "User Management",
    icon: "briefcase",
    link: "/user-management",
  },

  {
    id: uuid(),
    title: "Staff Management",
    icon: "briefcase",
    link: "/staff-management",
  },

  {
    id: uuid(),
    title: "Deposit History",
    icon: "briefcase",
    link: "/deposit-history",
  },
  {
    id: uuid(),
    title: "Withdraw Management",
    icon: "briefcase",
    link: "/withdraw-management",
  },

  {
    id: uuid(),
    title: "Payments Structure",
    icon: "briefcase",
    link: "/payments-structure",
  },
  {
    id: uuid(),
    title: "Ad Banner",
    icon: "image",
    link: "/ad-banner",
  },
  {
    id: uuid(),
    title: "App Update",
    icon: "upload",
    link: "/app-update",
  },
  {
    id: uuid(),
    title: "Push Notification",
    icon: "send",
    link: "/push-notification",
  },
  {
    id: uuid(),
    title: "Support Tickets",
    icon: "help-circle",
    link: "/support",
  },
  {
    id: uuid(),
    title: "Staff Reports",
    icon: "flag",
    link: "/staff-reports",
  },

  // {
  //   id: uuid(),
  //   title: "Stake Management",
  //   icon: "mail",
  //   className: "stake-management",
  //   children: [
  //     { id: uuid(), link: "/stake/plans/total-plans", name: "Total Plans" },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Stake Management",
  //   subtitle: "Plans",
  //   icon: <FaSackDollar />,
  //   className: "stake-management",
  //   children: [
  //     {
  //       id: uuid(),
  //       title: "Plans",
  //       children: [
  //         {
  //           id: uuid(),
  //           name: "Total Plans",
  //           link: "/stake/plans/total-plans",
  //         },
  //         {
  //           id: uuid(),
  //           name: "Add Plans",
  //           link: "/stake/plans/add-plan",
  //         },
  //       ],
  //     },
  //     {
  //       id: uuid(),
  //       title: "Staked Users",
  //       children: [
  //         {
  //           id: uuid(),
  //           name: "Total Staked Users",
  //           link: "/stake/user/total-users",
  //         },
  //       ],
  //     },
  //   ],
  // },

  // {
  //   id: uuid(),
  //   title: "User Management",
  //   icon: <FaUserGroup />,
  //   className: "user-management",
  //   children: [
  //     { id: uuid(), link: "/user/total-users", name: "Total Users" },
  //     { id: uuid(), link: "/user/deactive-users", name: "Deactive Users" },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Deposit Management",
  //   icon: <FaCoins />,
  //   className: "deposit-management",
  //   children: [
  //     { id: uuid(), link: "/deposit/crypto", name: "Crypto Deposits" },
  //     { id: uuid(), link: "/deposit/fiat", name: "Fiat Deposits" },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Withdraw Management",
  //   icon: <BsCoin />,
  //   className: "withdraw-management",
  //   children: [
  //     { id: uuid(), link: "/withdraw/crypto", name: "Crypto Withdrawal" },
  //     { id: uuid(), link: "/withdraw/fiat", name: "Fiat Withdrawal" },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Transaction Management",
  //   icon: <GrTransaction />,
  //   className: "deposit-management",
  //   children: [
  //     {
  //       id: uuid(),
  //       title: "Buy Transactions",
  //       children: [
  //         {
  //           id: uuid(),
  //           name: "Crypto",
  //           link: "/transaction/buy/crypto",
  //         },
  //         {
  //           id: uuid(),
  //           name: "Fiat",
  //           link: "/transaction/buy/fiat",
  //         },
  //       ],
  //     },
  //     {
  //       id: uuid(),
  //       title: "Sell Transactions",
  //       children: [
  //         {
  //           id: uuid(),
  //           name: "Crypto",
  //           link: "/transaction/sell/crypto",
  //         },
  //         {
  //           id: uuid(),
  //           name: "Fiat",
  //           link: "/transaction/sell/fiat",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Event Management",
  //   icon: <BsCoin />,
  //   className: "event-management",
  //   children: [
  //     { id: uuid(), link: "/events", name: "Manage Events" },
  //     { id: uuid(), link: "/events/add-events", name: "Add Events" },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Fee Management",
  //   icon: <BsCoin />,
  //   className: "withdraw-management",
  //   children: [{ id: uuid(), link: "/withdraw/fee", name: "Manage Fee" }],
  // },
  // {
  //   id: uuid(),
  //   title: "Holding Tokens",
  //   icon: "home",
  //   link: "/holding-tokens",
  // },
  // {
  //   id: uuid(),
  //   title: "User Balance",
  //   icon: "home",
  //   link: "/user-balance",
  // },
  // {
  //   id: uuid(),
  //   title: "Enquiry Details",
  //   icon: "home",
  //   link: "/enquiry-details",
  // },
  // {
  //   id: uuid(),
  //   title: "Appointments",
  //   icon: "home",
  //   link: "/appointment-details",
  // },
  // {
  //   id: uuid(),
  //   title: "Admin Management",
  //   icon: <BsCoin />,
  //   className: "admin-management",
  //   children: [
  //     { id: uuid(), link: "/admin/account", name: "Manage Account Details" },
  //     { id: uuid(), link: "/admin/login-histories", name: "Login Histories" },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Events",
  //   icon: "home",
  //   link: "/events",
  // },
  // {
  //   id: uuid(),
  //   title: "Area Of Interest",
  //   icon: "mail",
  //   className: "user-management",
  //   children: [
  //     {
  //       id: uuid(),
  //       name: "Total Area Of Interest",
  //       icon: "home",
  //       link: "/area-of-interest",
  //     },
  //     {
  //       id: uuid(),
  //       name: "Add Area Of Interest",
  //       icon: "home",
  //       link: "/add-area-of-interest",
  //     },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Offers Management",
  //   icon: "mail",
  //   className: "offers-management",
  //   children: [
  //     {
  //       id: uuid(),
  //       name: "Total Offers",
  //       icon: "home",
  //       link: "/total-offers",
  //     },
  //     {
  //       id: uuid(),
  //       name: "Add Offers",
  //       icon: "home",
  //       link: "/add-offers",
  //     },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Platform Fees",
  //   icon: "mail",
  //   className: "offers-management",
  //   children: [
  //     {
  //       id: uuid(),
  //       name: "Platform Fees History",
  //       icon: "home",
  //       link: "/platform-fee-history",
  //     },
  //   ],
  // },
  // {
  //   id: uuid(),
  //   title: "Payment History",
  //   icon: "home",
  //   link: "/payment-history",
  // },
  // {
  //   id: uuid(),
  //   title: "Admin Login History",
  //   icon: "home",
  //   link: "/admin-login-history",
  // },
  // {
  //   id: uuid(),
  //   title: "Ticket Details",
  //   icon: "home",
  //   link: "/ticket-details",
  // },
  // {
  //   id: uuid(),
  //   title: "Scanner Management",
  //   icon: "mail",
  //   className: "offers-management",
  //   children: [
  //     {
  //       id: uuid(),
  //       name: "Total Users",
  //       icon: "home",
  //       link: "/total-scanner-users",
  //     },
  //     {
  //       id: uuid(),
  //       name: "Add  Users",
  //       icon: "home",
  //       link: "/add-scanner-users",
  //     },
  //   ],
  // },
];

export default DashboardMenu;
