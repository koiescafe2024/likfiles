import React from "react";
import MoreSVG from "../../assets/more.svg";
import HomeSVG from "../../assets/home.svg";
import PromotionSVG from "../../assets/promotion.svg";
import AccountSVG from "../../assets/account.svg";
import ChatSVG from "../../assets/chat.svg";
import { useDispatch } from "react-redux";
import { reverse } from "../../redux/reducers/openMenu";
import { useNavigate } from "react-router-dom";

const CONTACT_US_LINE_APP_INVITE_URL = "https://lin.ee/5WaeTDb";

const MobileFooter = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onMoreHandler = () => {
        dispatch(reverse());
    };

    const onHomeHandler = () => {
        navigate("/", {
            replace: true,
        });
    };

    const onPromotionHandler = () => {
        navigate(`/promotion`, { replace: true });
    };

    const onAccountHandler = () => {
        navigate(`/account`, { replace: true });
    };

    const onContactHandler = () => {
        window.open(CONTACT_US_LINE_APP_INVITE_URL, "_blank");
    };
    return (
        <>
            <div class="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 flex md:hidden justify-around items-center z-50">
                <div
                    class="tabbar-item flex flex-col items-center w-[20%]"
                    onClick={() => onMoreHandler()}
                >
                    <img src={MoreSVG} width={20} height={20} />
                    <span class="text-white text-xs font-medium mt-1 truncate max-w-full">
                        More
                    </span>
                </div>
                <div
                    class="tabbar-item flex flex-col items-center w-[20%]"
                    onClick={() => onPromotionHandler()}
                >
                    <img src={HomeSVG} width={20} height={20} />
                    <span class="text-white text-xs font-medium mt-1 truncate max-w-full">
                        Promotion
                    </span>
                </div>
                <div
                    class="tabbar-item flex flex-col items-center w-[20%]"
                    onClick={() => onHomeHandler()}
                >
                    <div class="wallet-tabbar-wrap">
                        <div class="w-6 h-6 flex items-center justify-center ">
                            <div class="absolute top-[-0.7rem] w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
                                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700">
                                    <img
                                        src={PromotionSVG}
                                        width={20}
                                        height={20}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <span class="text-white text-xs font-medium mt-1 truncate max-w-full">
                        Home
                    </span>
                </div>
                <div
                    class="tabbar-item flex flex-col items-center w-[20%]"
                    onClick={() => {
                        onAccountHandler();
                    }}
                >
                    <img src={AccountSVG} width={20} height={20} />
                    <span class="text-white text-xs font-medium mt-1 truncate max-w-full">
                        Account
                    </span>
                </div>
                <div
                    class="tabbar-item flex flex-col items-center w-[20%]"
                    onClick={() => onContactHandler()}
                >
                    <div class="dont-badge"></div>
                    <img src={ChatSVG} width={20} height={20} />
                    <span class="text-white text-xs font-medium mt-1 truncate max-w-full">
                        Contact
                    </span>
                </div>
            </div>
        </>
    );
};

export default MobileFooter;
