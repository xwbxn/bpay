import { SearchBar, useTheme } from "@rneui/themed";
import React from "react";

export default function ({ width }) {
    const { theme } = useTheme()

    return <SearchBar round
        containerStyle={{
            backgroundColor: theme.colors.primary,
            borderTopColor: theme.colors.primary, borderBottomWidth: 0
        }}
        inputContainerStyle={{ height: 40, backgroundColor: theme.colors.background, width: width }}
        showCancel lightTheme>
    </SearchBar>;
}