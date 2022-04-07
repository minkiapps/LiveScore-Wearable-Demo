package com.minkiapps.android.livescore

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.minkiapps.android.livescore.WearEngineService.Companion.EXTRA_DEVICE
import com.minkiapps.android.livescore.log.LogModel
import com.minkiapps.android.livescore.log.Type
import com.minkiapps.android.livescore.prefs.AppPreferences
import com.minkiapps.android.livescore.ui.theme.LiveScoreDemoTheme
import com.minkiapps.android.livescore.util.getSignatureSha256Fingerprint
import org.koin.android.ext.android.inject
import timber.log.Timber
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {

    private val mainViewModel: MainViewModel by viewModels()
    private val appPreferences: AppPreferences by inject()

    private var wearEngineService: WearEngineService? = null

    private val logDateFormatter = SimpleDateFormat("MMM dd, HH:mm:ss.SSS", Locale.getDefault())
    private val serviceLogDateFormatter = SimpleDateFormat("MMM dd, HH:mm:ss", Locale.getDefault())

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            // We've bound to LocalService, cast the IBinder and get LocalService instance
            val binder = service as WearEngineService.LocalBinder
            wearEngineService = binder.getService()
            wearEngineService?.let {
                it.logListener = mainViewModel
                mainViewModel.addLogs(it.temporaryLogPersistence)
                it.temporaryLogPersistence.clear()
            }
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            LiveScoreDemoTheme {
                if (mainViewModel.showHuaweiHealthPermissionApp.value) {
                    ShowEnableHuaweiWearablePermissionDialog(
                        {
                            mainViewModel.gotoHiWearPermissionPage()
                        },
                        {
                            mainViewModel.showHuaweiHealthPermissionApp.value = false
                        }
                    )
                }

                Surface(
                    color = MaterialTheme.colors.background,
                    modifier = Modifier
                        .fillMaxSize()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(8.dp)
                    ) {
                        ServiceLogButton(serviceLogDateFormatter, {
                            appPreferences.getAllServiceLog()
                        }, {
                            appPreferences.deleteServiceLogs()
                        })

                        LogUI(
                            logDateFormatter,
                            packageName,
                            getSignatureSha256Fingerprint(),
                            mainViewModel.logs.value
                        ) {
                            mainViewModel.clearLogs()
                        }
                    }
                }
            }
        }

        mainViewModel.checkWearablePreConditions()
        mainViewModel.getStartWearEngineServiceLiveData().observe(this) {
            val intent = Intent(this, WearEngineService::class.java).apply {
                putExtra(EXTRA_DEVICE, it)
            }
            bindService(intent, connection, Context.BIND_AUTO_CREATE)
            startService(intent)
        }
    }

    override fun onStop() {
        super.onStop()
        wearEngineService?.let {
            it.logListener = null
            unbindService(connection)
        }
    }
}

@Composable
fun ServiceLogButton(
    formatter: SimpleDateFormat,
    getServiceLogs: () -> List<Pair<Long, String>>,
    deleteLogClick: () -> Unit
) {
    var showLogDialog by remember { mutableStateOf(false) }

    if (showLogDialog) {
        Dialog(onDismissRequest = { showLogDialog = false }) {
            Card {
                Column {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(300.dp)
                            .padding(4.dp)
                    ) {
                        items(getServiceLogs()) { i ->
                            val text = "${formatter.format(Date(i.first))}: ${i.second}"

                            Text(
                                text = text,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Row(
                        horizontalArrangement = Arrangement.End,
                        modifier = Modifier.fillMaxWidth()
                    ) {

                        TextButton(onClick = {
                            showLogDialog = false
                        }) {
                            Text(text = "Cancel")
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                        TextButton(onClick = {
                            showLogDialog = false
                            deleteLogClick.invoke()
                        }) {
                            Text(text = "Delete Logs")
                        }
                    }
                }
            }
        }
    }

    Button(onClick = {
        showLogDialog = true
    }) {
        Text(text = "Show Service Lifecycle Log")
    }
}

@Composable
fun ShowEnableHuaweiWearablePermissionDialog(
    gotoPermissionPage: () -> Unit,
    dismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = {
            dismiss.invoke()
        },
        title = {
            Text(text = "Huawei Wearable detected")
        },
        text = {
            Text("You need to enable Device Connection Permission in Huawei Health App to use LiveScore app on Huawei Wearables.")
        },
        confirmButton = {
            Button(
                onClick = {
                    dismiss.invoke()
                    gotoPermissionPage.invoke()
                }) {
                Text("Go to Huawei Health Permission Page")
            }
        },
        dismissButton = {
            Button(
                onClick = {
                    dismiss.invoke()
                }) {
                Text("Dismiss")
            }
        }
    )
}

@Composable
fun LogUI(
    formatter: SimpleDateFormat,
    packageName: String,
    signatureFingerprint: String?,
    logLines: List<LogModel>,
    clearLogs: () -> Unit
) {
    Timber.d("Recompose LogUI")

    val sorted = logLines.sortedBy { it.timeStamp }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp)
        ) {
            Text(
                text = "Log Output (${packageName})",
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 2.dp)
            )

            signatureFingerprint?.let {
                Text(
                    text = it,
                    fontWeight = FontWeight.Light,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            LazyColumn(
                Modifier
                    .fillMaxWidth()
                    .weight(1f),
                state = LazyListState(
                    firstVisibleItemIndex = logLines.size
                )
            ) {
                items(sorted) { lm ->
                    val text = "${formatter.format(Date(lm.timeStamp))}: ${lm.text}"

                    when (lm.type) {
                        Type.DEBUG -> Text(
                            text = text,
                            style = MaterialTheme.typography.caption,
                        )
                        Type.FLASHY -> Text(
                            text = text,
                            style = MaterialTheme.typography.caption,
                            color = Color.Cyan
                        )
                        Type.ERROR -> Text(
                            text = text,
                            style = MaterialTheme.typography.caption,
                            color = Color.Red
                        )
                    }
                }
            }
        }
        IconButton(
            onClick = clearLogs,
            modifier = Modifier
                .size(40.dp)
                .align(Alignment.TopEnd)
        ) {
            Icon(
                painter = painterResource(id = R.drawable.ic_baseline_delete_24),
                contentDescription = "Delete Logs",
                tint = Color.Red,
            )
        }
    }
}