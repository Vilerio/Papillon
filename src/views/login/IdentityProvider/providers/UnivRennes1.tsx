import React from "react";
import { Image, View, StyleSheet, Text } from "react-native";

import { WebView } from "react-native-webview";


import type { Screen } from "@/router/helpers/types";
import { useAccounts, useCurrentAccount } from "@/stores/account";
import { AccountService, LocalAccount } from "@/stores/account/types";
import defaultPersonalization from "@/services/local/default-personalization";
import uuid from "@/utils/uuid-v4";

const UnivRennes1_Login: Screen<"UnivRennes1_Login"> = ({ navigation }) => {
  const mainURL = "https://sesame.univ-rennes1.fr/comptes/";

  const webViewRef = React.useRef<WebView>(null);

  const createStoredAccount = useAccounts(store => store.create);
  const switchTo = useCurrentAccount(store => store.switchTo);

  const loginUnivData = async (data: any) => {
    if (data?.user?.uid !== null) {
      const local_account: LocalAccount = {
        authentication: undefined,
        instance: undefined,

        identityProvider: {
          identifier: "univ-rennes1",
          name: "Université de Rennes",
          rawData: data
        },

        localID: uuid(),
        service: AccountService.Local,

        isExternal: false,
        linkedExternalLocalIDs: [],

        name: data?.user?.infos?.lastName + " " + data?.user?.infos?.firstName,
        studentName: {
          first: data?.user?.infos?.firstName,
          last: data?.user?.infos?.lastName,
        },
        className: "", // TODO ?
        schoolName: "Université de Rennes",

        personalization: await defaultPersonalization()
      };

      createStoredAccount(local_account);
      switchTo(local_account);

      queueMicrotask(() => {
        // Reset the navigation stack to the "Home" screen.
        // Prevents the user from going back to the login screen.
        navigation.reset({
          index: 0,
          routes: [{ name: "AccountCreated" }],
        });
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <WebView
        source={{ uri: mainURL }}
        style={{
          height: "100%",
          width: "100%",
        }}
        ref={webViewRef}
        startInLoadingState={true}
        incognito={true}
        onLoadEnd={(e) => {
          if (e.nativeEvent.title === "Sésame" && e.nativeEvent.url === mainURL) {
            webViewRef.current?.injectJavaScript(`
              window.location.href = "https://sesame.univ-rennes1.fr/comptes/api/auth/data";
            `);
          }

          if (e.nativeEvent.url === "https://sesame.univ-rennes1.fr/comptes/api/auth/data") {
            webViewRef.current?.injectJavaScript(`
              window.ReactNativeWebView.postMessage(JSON.stringify({type: "loginData", data: document.querySelector("pre").innerText}));
            `);
          }
        }}

        onMessage={(e) => {
          const data = JSON.parse(e.nativeEvent.data);
          if (data.type === "loginData") {
            loginUnivData(JSON.parse(data.data));
          }
        }}
      />
    </View>
  );
};

export default UnivRennes1_Login;