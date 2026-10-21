package com.plc.directmaintenance.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private data class ChecklistItem(
    val title: String,
    val description: String
)

private val routineChecklistItems = listOf(
    ChecklistItem(
        title = "Inspect control panel",
        description = "Check the enclosure, door, seals, and visible damage."
    ),
    ChecklistItem(
        title = "Check PLC status",
        description = "Review PLC status indicators and recorded diagnostics."
    ),
    ChecklistItem(
        title = "Inspect wiring",
        description = "Look for visible damage, loose cable glands, or overheating."
    ),
    ChecklistItem(
        title = "Check power supply",
        description = "Review power-supply indicators and approved voltage readings."
    ),
    ChecklistItem(
        title = "Inspect communication links",
        description = "Check Ethernet or serial connections and communication faults."
    ),
    ChecklistItem(
        title = "Review active alarms",
        description = "Record active alarms and investigate their documented causes."
    ),
    ChecklistItem(
        title = "Check cooling and ventilation",
        description = "Inspect filters, fans, and ventilation openings."
    ),
    ChecklistItem(
        title = "Record maintenance findings",
        description = "Document observations, corrective work, and outstanding issues."
    )
)

@Composable
fun RoutineChecklistScreen(
    modifier: Modifier = Modifier,
    onFinish: (completedCount: Int, totalCount: Int) -> Unit = { _, _ -> }
) {
    val checkedItems = remember {
        mutableStateListOf<Boolean>().apply {
            repeat(routineChecklistItems.size) {
                add(false)
            }
        }
    }

    val completedCount = checkedItems.count { it }
    val totalCount = routineChecklistItems.size

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Routine Maintenance",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "PLC inspection and maintenance checklist",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline
            ),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Checklist progress",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "$completedCount of $totalCount tasks completed",
                    style = MaterialTheme.typography.bodyLarge
                )

                Spacer(modifier = Modifier.height(10.dp))

                androidx.compose.material3.LinearProgressIndicator(
                    progress = {
                        if (totalCount == 0) {
                            0f
                        } else {
                            completedCount.toFloat() / totalCount
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            itemsIndexed(routineChecklistItems) { index, item ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(
                        width = 1.dp,
                        color = if (checkedItems[index]) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.outlineVariant
                        }
                    ),
                    colors = CardDefaults.cardColors(
                        containerColor = if (checkedItems[index]) {
                            MaterialTheme.colorScheme.primaryContainer
                        } else {
                            MaterialTheme.colorScheme.surface
                        }
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(
                                horizontal = 12.dp,
                                vertical = 10.dp
                            ),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = checkedItems[index],
                            onCheckedChange = { checked ->
                                checkedItems[index] = checked
                            }
                        )

                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .padding(start = 8.dp)
                        ) {
                            Text(
                                text = item.title,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = item.description,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Divider()

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Safety reminder",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "Follow approved site procedures. Do not open energized " +
                "panels or modify PLC logic unless authorized. This checklist " +
                "does not replace the equipment manufacturer's maintenance instructions.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = {
                    for (index in checkedItems.indices) {
                        checkedItems[index] = false
                    }
                },
                modifier = Modifier.weight(1f),
                border = BorderStroke(
                    width = 1.dp,
                    color = MaterialTheme.colorScheme.outline
                )
            ) {
                Text("Reset")
            }

            Button(
                onClick = {
                    onFinish(completedCount, totalCount)
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Finish")
            }
        }
    }
}
