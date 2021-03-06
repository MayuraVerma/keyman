package com.tavultesoft.kmea.data;

import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.tavultesoft.kmea.BuildConfig;
import com.tavultesoft.kmea.JSONParser;
import com.tavultesoft.kmea.KMKeyboardDownloaderActivity;
import com.tavultesoft.kmea.KMManager;
import com.tavultesoft.kmea.KeyboardPickerActivity;
import com.tavultesoft.kmea.R;
import com.tavultesoft.kmea.packages.JSONUtils;
import com.tavultesoft.kmea.util.FileUtils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

public class CloudRepository {
  static public final CloudRepository shared = new CloudRepository();
  static private final String TAG = "CloudRepository";

  private Dataset memCachedDataset;
  private Calendar lastLoad; // To be used for Dataset caching.
  private boolean invalidateLexicalCache = false;

  // DEBUG:  Never allow these to be `true` in production.
  private static final boolean DEBUG_DISABLE_CACHE = false;
  private static final boolean DEBUG_SIMULATE_UPDATES = false;

  private CloudRepository() {
    // Tracks the time of the most recent cache.  We start at null to indicate that we haven't
    // tried to read the cache yet, as we don't yet have a Context instance to reference.
    lastLoad = null;
  }

  public interface UpdateHandler {
    void onUpdateDetection(List<Bundle> updateBundles);
  }

  public boolean hasCache(Context context) {
    if(DEBUG_DISABLE_CACHE) {
      return false;
    }

    if(shouldUseMemCache(context)) {
      return true;
    } else {
      return shouldUseCache(context, getKeyboardCacheFile(context)) &&
          shouldUseCache(context, getLexicalModelCacheFile(context));
    }
  }

  private boolean shouldUseMemCache(Context context) {
    if(DEBUG_DISABLE_CACHE) {
      return false;
    }

    boolean hasConnection = KMManager.hasConnection(context);

    if (memCachedDataset != null) {
      Calendar lastModified = Calendar.getInstance();
      lastModified.setTime(lastLoad.getTime());
      lastModified.add(Calendar.HOUR_OF_DAY, 1);
      Calendar now = Calendar.getInstance();
      return (!hasConnection || lastModified.compareTo(now) > 0);
    } else {
      return false;
    }
  }

  private boolean shouldUseCache(Context context, File cacheFile) {
    if(DEBUG_DISABLE_CACHE) {
      return false;
    }

    boolean hasConnection = KMManager.hasConnection(context);

    // Forced cache bypass - we need to load more lexical models (signaled by invalidation).
    if(this.invalidateLexicalCache && cacheFile.equals(this.getLexicalModelCacheFile(context))) {
      this.invalidateLexicalCache = false;
      return false;
    }

    if (cacheFile.exists()) {
      Calendar lastModified = Calendar.getInstance();
      lastModified.setTime(new Date(cacheFile.lastModified()));
      lastModified.add(Calendar.HOUR_OF_DAY, 1);
      Calendar now = Calendar.getInstance();
      return (!hasConnection || lastModified.compareTo(now) > 0);
    } else {
      return false;
    }
  }

  // Should be called whenever a new language code starts being managed in order to help signal
  // retrieval of the language code's lexical models.
  public void invalidateLexicalModelCache(@NonNull Context context) {
    this.invalidateLexicalCache = true;

    // We should also pre-emptively clear out the old cache file
    // in case of an app close or crash.
    File file = getLexicalModelCacheFile(context);
    file.delete();
  }

  public Dataset fetchDataset(@NonNull Context context) {
    return fetchDataset(context, null, null, null);
  }

  /**
   * Fetches a Dataset object corresponding to keyboards and models available from the Cloud API
   * services.  Unless recently cached, this object will be populated asynchronously.
   * @param context   The current Activity requesting the Dataset.
   * @param updateHandler  An object that can handle update notification if desired.
   * @param onSuccess  A callback to be triggered on completion of all queries and operations.
   * @param onFailure  A callback to be triggered upon failure of a query.
   * @return  A Dataset object implementing the Adapter interface to be asynchronously filled.
   */
  public Dataset fetchDataset(@NonNull Context context, UpdateHandler updateHandler, Runnable onSuccess, Runnable onFailure) {
    boolean loadKeyboardsFromCache = this.shouldUseCache(context, getKeyboardCacheFile(context));
    boolean loadLexicalModelsFromCache = this.shouldUseCache(context, getLexicalModelCacheFile(context));

    boolean cacheValid = loadKeyboardsFromCache && loadLexicalModelsFromCache;

    if(cacheValid && shouldUseMemCache(context)) {
      return memCachedDataset; // isn't null - checked by `shouldUseCache`.
    }

    // Can't use the mem-cached version as is - let's prep it / reuse the instance.
    if(memCachedDataset == null) {
      memCachedDataset = new Dataset(context);
    } else {
      // Clear the cached data and rebuild it from scratch.
      memCachedDataset.clear();
    }

    lastLoad = Calendar.getInstance(); // Mark a cache timing.

    // Get the installed language codes listing.
    Dataset installedSet = KeyboardPickerActivity.getInstalledDataset(context);
    List<String> languageCodes = new ArrayList<>(installedSet.getCount());
    for(int i=0; i < installedSet.getCount(); i++) {
      languageCodes.add(installedSet.getItem(i).code);
    }

    // Get kmp.json info from installed (adhoc and cloud) models.
    // Consolidate kmp.json info from packages/
    JSONObject kmpLanguagesArray = wrapKmpKeyboardJSON(JSONUtils.getLanguages());
    JSONArray kmpLexicalModelsArray = JSONUtils.getLexicalModels();

    if (kmpLanguagesArray.length() == 0 && kmpLexicalModelsArray.length() == 0) {
      // May need to note this for handling a 'failure' check.
    } else {
      memCachedDataset.keyboards.addAll(processKeyboardJSON(kmpLanguagesArray, true));
      memCachedDataset.lexicalModels.addAll(processLexicalModelJSON(kmpLexicalModelsArray));
    }

    CloudDownloadTask downloadTask = new CloudDownloadTask(context, memCachedDataset, updateHandler, onSuccess, onFailure);

//    CloudApiParam[] cloudQueries = new CloudApiParam[2];
//    int cloudQueryEntries = 0;
    List<CloudApiParam> cloudQueries = new ArrayList<>(2);
    // Default values:  empty JSON instances.  `null` will instead break things.
    JSONObject kbdData = new JSONObject();
    JSONArray lexData = new JSONArray();

    if(loadKeyboardsFromCache) {
      kbdData = getCachedJSONObject(getKeyboardCacheFile(context));

      // In case something went wrong with the last cache attempt, which can cause a null return.
      if(kbdData == null) {
        kbdData = new JSONObject();
        loadKeyboardsFromCache = false;
      }
    }

    if(!loadKeyboardsFromCache) {
      String deviceType = context.getString(R.string.device_type);
      if (deviceType.equals("AndroidTablet")) {
        deviceType = "androidtablet";
      } else {
        deviceType = "androidphone";
      }

      // Retrieves the cloud-based keyboard catalog in Android's preferred format.
      String keyboardURL = String.format("%s?version=%s&device=%s&languageidtype=bcp47",
          KMKeyboardDownloaderActivity.kKeymanApiBaseURL, BuildConfig.VERSION_NAME, deviceType);

      //cloudQueries[cloudQueryEntries++] = new CloudApiParam(ApiTarget.Keyboards, keyboardURL, JSONType.Object);
      cloudQueries.add(new CloudApiParam(ApiTarget.Keyboards, keyboardURL, JSONType.Object));
    }

    if(loadLexicalModelsFromCache) {
      lexData = getCachedJSONArray(getLexicalModelCacheFile(context));

      if(lexData == null) {
        lexData = new JSONArray();
        loadLexicalModelsFromCache = false;
      }
    }

    if(!loadLexicalModelsFromCache) {
      // This allows us to directly get the full lexical model catalog.
      // TODO:  Remove and replace with commented-out code below once the proper multi-language
      //        query is ready!
      String lexicalURL = String.format("%s?q", KMKeyboardDownloaderActivity.kKeymanApiModelURL);

      cloudQueries.add(new CloudApiParam(ApiTarget.LexicalModels, lexicalURL, JSONType.Array));


      // TODO: We want a list of lexical models for every language with an installed resource (kbd, lex model)
//      String lexicalURL = String.format("%s?q=bcp47:", KMKeyboardDownloaderActivity.kKeymanApiModelURL);
//
//      for(String lgCode: languageCodes) {
//        lexicalURL = String.format("%s%s,", lexicalURL, lgCode);
//      }
//
//      lexicalURL = lexicalURL.substring(0, lexicalURL.lastIndexOf(','));

      /* do what's possible here, rather than in the Task */
    }

    boolean executeCallbacks = true;
    int cloudQueryEntries = cloudQueries.size();
    if(cloudQueryEntries > 0) {
      // We need the array to be exactly the same size as our entry count.
      CloudApiParam[] params = new CloudApiParam[cloudQueryEntries];
      cloudQueries.toArray(params);
      // We can pass in multiple URLs; this format is extensible if we need extra catalogs in the future.
      downloadTask.execute(params);
      executeCallbacks = false;
    }

    // Reuse any valid parts of the cache.
    if(loadKeyboardsFromCache || loadLexicalModelsFromCache) {
      CloudDownloadReturns jsonData = new CloudDownloadReturns(kbdData, lexData);

      // Call the processor method directly with the cached API data.
      downloadTask.processCloudReturns(jsonData, executeCallbacks); // TODO:  Take params for finish, return val for failures
    }

    return memCachedDataset;
  }

  protected File getKeyboardCacheFile(Context context) {
    final String jsonCacheFilename = "jsonKeyboardsCache.dat";
    return new File(context.getCacheDir(), jsonCacheFilename);
  }

  protected File getLexicalModelCacheFile(Context context) {
    final String jsonLexicalCacheFilename = "jsonLexicalModelsCache.dat";
    return new File(context.getCacheDir(), jsonLexicalCacheFilename);
  }

  protected JSONArray getCachedJSONArray(File file) {
    JSONArray lmData = null;
    try {
      // Read from cache file
      if (file.exists()) {
        ObjectInputStream objInput = new ObjectInputStream(new FileInputStream(file));
        lmData = new JSONArray(objInput.readObject().toString());
        objInput.close();
      }
    } catch (Exception e) {
      Log.e(TAG, "Failed to read from cache file. Error: " + e);
      lmData = null;
    }

    return lmData;
  }

  protected JSONObject getCachedJSONObject(File file) {
    JSONObject kbData = null;
    try {
      // Read from cache file
      if (file.exists()) {
        ObjectInputStream objInput = new ObjectInputStream(new FileInputStream(file));
        kbData = new JSONObject(objInput.readObject().toString());
        objInput.close();
      }
    } catch (Exception e) {
      Log.e(TAG, "Failed to read from cache file. Error: " + e);
      kbData = null;
    }

    return kbData;
  }

  /**
   * Save the JSON catalog data that's available from the cloud.
   * The catalog is saved to a unique file.  Separate files should
   * be used for each API call, such as for keyboards vs lexical models.
   * @param json - Array of JSON objects containing API return info
   */
  private static void saveJSONArrayToCache(File file, JSONArray json) {
    ObjectOutput objOutput;
    try {
      // Save to cache file
      objOutput = new ObjectOutputStream(new FileOutputStream(file));
      objOutput.writeObject(json.toString());
      objOutput.close();
    } catch (Exception e) {
      Log.e(TAG, "Failed to save to cache file. Error: " + e);
    }
  }

  /**
   * Save the JSON catalog data that's available from the cloud.
   * The catalog is saved to a unique file.  Separate files should
   * be used for each API call, such as for keyboards vs lexical models.
   * @param json - JSON object containing API return info
   */
  private static void saveJSONObjectToCache(File file, JSONObject json) {
    ObjectOutput objOutput;
    try {
      // Save to cache file
      objOutput = new ObjectOutputStream(new FileOutputStream(file));
      objOutput.writeObject(json.toString());
      objOutput.close();
    } catch (Exception e) {
      Log.e(TAG, "Failed to save to cache file. Error: " + e);
    }
  }

  protected JSONObject wrapKmpKeyboardJSON(JSONArray languagesArray) {
    try {
      JSONObject json = new JSONObject().put(KMKeyboardDownloaderActivity.KMKey_Languages, languagesArray);
      return new JSONObject().put(KMKeyboardDownloaderActivity.KMKey_Languages, json);
    } catch (JSONException e) {
      Log.e(TAG, "Failed to properly handle KMP JSON.  Error: " + e);
      return null;
    }
  }

  protected List<Keyboard> processKeyboardJSON(JSONObject query, boolean fromKMP) {
    List<Keyboard> keyboardsList = new ArrayList<>();
    //keyboardModifiedDates = new HashMap<String, String>();

    String isCustom = fromKMP ? "Y" : "N";

    try {
      // Thank you, Cloud API format.
      JSONArray languages = query.getJSONObject(KMKeyboardDownloaderActivity.KMKey_Languages).getJSONArray(KMKeyboardDownloaderActivity.KMKey_Languages);
      for (int i = 0; i < languages.length(); i++) {
        JSONObject language = languages.getJSONObject(i);

        String langID = language.getString(KMManager.KMKey_ID);
        String langName = language.getString(KMManager.KMKey_Name);

        JSONArray langKeyboards = language.getJSONArray(KMKeyboardDownloaderActivity.KMKey_LanguageKeyboards);

        int kbLength = langKeyboards.length();
        for (int j = 0; j < kbLength; j++) {
          JSONObject keyboardJSON = langKeyboards.getJSONObject(j);
          String kbID = keyboardJSON.getString(KMManager.KMKey_ID);
          String kbName = keyboardJSON.getString(KMManager.KMKey_Name);
          String kbVersion = keyboardJSON.optString(KMManager.KMKey_KeyboardVersion, "1.0");
          String kbFont = keyboardJSON.optString(KMManager.KMKey_Font, "");

          //String kbKey = String.format("%s_%s", langID, kbID);
          HashMap<String, String> hashMap = new HashMap<String, String>();
          hashMap.put(KMManager.KMKey_KeyboardName, kbName);
          hashMap.put(KMManager.KMKey_KeyboardID, kbID);
          hashMap.put(KMManager.KMKey_LanguageName, langName);
          hashMap.put(KMManager.KMKey_LanguageID, langID);
          hashMap.put(KMManager.KMKey_KeyboardVersion, kbVersion);
          hashMap.put(KMManager.KMKey_CustomKeyboard, isCustom);
          hashMap.put(KMManager.KMKey_Font, kbFont);

//          if (keyboardModifiedDates.get(kbID) == null) {
//            keyboardModifiedDates.put(kbID, keyboardJSON.getString(KMManager.KMKey_KeyboardModified));
//          }

          keyboardsList.add(new Keyboard(hashMap));
        }
      }
    } catch (JSONException e) {
      Log.e("JSONParse", "Error: " + e);
      return new ArrayList<>();  // Is this ideal?
    }

    return keyboardsList;
  }

  protected List<LexicalModel> processLexicalModelJSON(JSONArray models) {
    List<LexicalModel> modelList = new ArrayList<>(models.length());

    try {
      // Parse each model JSON Object.
      int modelsLength = models.length();
      for (int i = 0; i < modelsLength; i++) {
        JSONObject model = models.getJSONObject(i);
        String packageID = "", modelURL = "";
        if (model.has(KMManager.KMKey_PackageID)) {
          packageID = model.getString(KMManager.KMKey_PackageID);
        } else {
          // Determine package ID from packageFilename
          modelURL = model.optString("packageFilename", "");
          packageID = FileUtils.getFilename(modelURL);
          // Android keeps the .model part of the file extension as part of the package ID.
          packageID = packageID.replace(".kmp", "");
        }

        // api.keyman.com query returns an array of language IDs Strings while
        // kmp.json "languages" is an array of JSONObject
        String languageID = "", langName = "";
        Object obj = model.getJSONArray("languages");
        if (((JSONArray) obj).get(0) instanceof String) {
          // language name not provided, so re-use language ID
          languageID = model.getJSONArray("languages").getString(0);
          langName = languageID;
        } else if (((JSONArray) obj).get(0) instanceof JSONObject) {
          JSONObject languageObj = model.getJSONArray("languages").getJSONObject(0);
          languageID = languageObj.getString("id");
          langName = languageObj.getString("name");
        }

        String modelID = model.getString("id");
        String modelName = model.getString("name");
        String modelVersion = model.getString("version");

        String isCustom = model.optString("CustomModel", "N");
        String icon = "0";

        HashMap<String, String> hashMap = new HashMap<String, String>();
        hashMap.put(KMManager.KMKey_PackageID, packageID);
        hashMap.put(KMManager.KMKey_LanguageID, languageID);
        hashMap.put(KMManager.KMKey_LexicalModelID, modelID);
        hashMap.put(KMManager.KMKey_LexicalModelName, modelName);
        hashMap.put(KMManager.KMKey_LanguageName, langName);
        hashMap.put(KMManager.KMKey_LexicalModelVersion, modelVersion);
        hashMap.put(KMManager.KMKey_CustomModel, isCustom);
        hashMap.put(KMManager.KMKey_LexicalModelPackageFilename, modelURL);
        hashMap.put("isEnabled", "true");
        hashMap.put(KMManager.KMKey_Icon, String.valueOf(R.drawable.ic_arrow_forward));

        modelList.add(new LexicalModel(hashMap));
      }
    } catch (JSONException e) {
      Log.e("JSONParse", "Error: " + e);
      return new ArrayList<>();  // Is this ideal?
    }

    return modelList;
  }

  private enum ApiTarget {
    Keyboards,
    LexicalModels
  }

  private enum JSONType {
    Array,
    Object
  }

  private static class CloudApiParam {
    public final ApiTarget target;
    public final String url;
    public final JSONType type;

    CloudApiParam(ApiTarget target, String url, JSONType type) {
      this.target = target;
      this.url = url;
      this.type = type;
    }
  }

  private static class CloudApiReturns {
    public final ApiTarget target;
    public final JSONArray jsonArray;
    public final JSONObject jsonObject;

    public CloudApiReturns(ApiTarget target, JSONArray jsonArray) {
      this.target = target;
      this.jsonArray = jsonArray;
      this.jsonObject = null;
    }

    public CloudApiReturns(ApiTarget target, JSONObject jsonObject) {
      this.target = target;
      this.jsonArray = null;
      this.jsonObject = jsonObject;
    }
  }

  private static class CloudDownloadReturns {
    public JSONObject keyboardJSON;
    public JSONArray lexicalModelJSON;

    // Used by the CloudDownloadTask, as it fits well with doInBackground's param structure.
    public CloudDownloadReturns(List<CloudApiReturns> returns) {
      JSONObject kbd = null;
      JSONArray lex = null;

      for(CloudApiReturns ret: returns) {
        switch(ret.target) {
          case Keyboards:
            kbd = ret.jsonObject;
            break;
          case LexicalModels:
            lex = ret.jsonArray;
        }
      }

      // Errors are thrown if we try to do this assignment within the loop.
      this.keyboardJSON = kbd;
      this.lexicalModelJSON = lex;
    }

    public CloudDownloadReturns(JSONObject keyboardJSON, JSONArray lexicalModelJSON) {
      this.keyboardJSON = keyboardJSON;
      this.lexicalModelJSON = lexicalModelJSON;
    }

    public boolean isEmpty() {
      boolean emptyKbd = false;
      boolean emptyLex = false;

      if (keyboardJSON == null) {
        emptyKbd = true;
      } else if (keyboardJSON.length() == 0) {
        emptyKbd = true;
      }

      if(lexicalModelJSON == null) {
        emptyLex = true;
      } else if(lexicalModelJSON.length() == 0) {
        emptyLex = true;
      }

      return emptyKbd && emptyLex;
    }
  }

  // This is copied from LanguageListActivity to download a catalog from the cloud.
  // TODO: Keyman roadmap is to refactor to use background WorkManager in Keyman 13.0
  private class CloudDownloadTask extends AsyncTask<CloudApiParam, Integer, CloudDownloadReturns> {
    private final boolean hasConnection;
    private ProgressDialog progressDialog;

    private final Context context;

    // These keyboard query callback parameters actually aren't used at present.
    private final Runnable querySuccess;
    private final Runnable failure;
    private final UpdateHandler updateHandler;

    //

    private final Dataset dataset;

    public CloudDownloadTask(Context context, Dataset dataset, UpdateHandler updateHandler, Runnable success, Runnable failure) {
      this.context = context;
      this.dataset = dataset;
      this.hasConnection = KMManager.hasConnection(context);

      Runnable dummy = new Runnable() {
        public void run() {
          // Do nothing.
        }
      };
      this.querySuccess = success != null ? success : dummy;
      this.failure = failure != null ? failure : dummy;

      this.updateHandler = updateHandler != null ? updateHandler : new UpdateHandler() {
        @Override
        public void onUpdateDetection(List<Bundle> updateBundles) {
          // Do nothing.
          return;
        }
      };
    }

    protected void showProgressDialog(final Runnable finishCallback) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
        progressDialog = new ProgressDialog(context, R.style.AppTheme_Dialog_Progress);
      } else {
        progressDialog = new ProgressDialog(context);
      }
      progressDialog.setMessage(context.getString(R.string.getting_cloud_catalog));
      progressDialog.setButton(DialogInterface.BUTTON_NEGATIVE, context.getString(R.string.label_cancel),
          new DialogInterface.OnClickListener() {

            @Override
            public void onClick(DialogInterface dialogInterface, int which) {
              cancel(true);
              progressDialog.dismiss();
              progressDialog = null;
              if(finishCallback != null) {
                finishCallback.run();
              }
              return;
            }
          });
      progressDialog.setCancelable(true);
      if (!((AppCompatActivity) context).isFinishing()) {
        progressDialog.show();
      } else {
        cancel(true);
        progressDialog = null;
      }
    }

    @Override
    protected void onPreExecute() {
      super.onPreExecute();

      if (hasConnection) {
        showProgressDialog(new Runnable() {
          @Override
          public void run() { // runs on 'cancel' selection.
            failure.run();
          }
        });
      }
    }

    @Override
    protected CloudDownloadReturns doInBackground(CloudApiParam... params) {
      if (isCancelled()) {
        return null;
      }

      List<CloudApiReturns> retrievedJSON = new ArrayList<>(params.length);
      if(progressDialog != null) {
        progressDialog.setMax(params.length);
      }

      for(CloudApiParam param:params) {
        JSONParser jsonParser = new JSONParser();
        JSONArray dataArray = null;
        JSONObject dataObject = null;

        if (hasConnection) {
          try {
            String remoteUrl = param.url;

            if(param.type == JSONType.Array) {
              dataArray = jsonParser.getJSONObjectFromUrl(remoteUrl, JSONArray.class);
            } else {
              dataObject = jsonParser.getJSONObjectFromUrl(remoteUrl, JSONObject.class);
            }
          } catch (Exception e) {
            Log.d(TAG, e.getMessage());
          }
        } else {
          // Offline trouble!  That said, we can't get anything, so we simply shouldn't add anything.
        }

        if(param.type == JSONType.Array) {
          retrievedJSON.add(new CloudApiReturns(param.target, dataArray));  // Null if offline.
        } else {
          retrievedJSON.add(new CloudApiReturns(param.target, dataObject)); // Null if offline.
        }
        if(progressDialog != null) {
          progressDialog.setProgress(progressDialog.getProgress());
        }
      }

      return new CloudDownloadReturns(retrievedJSON); // Will report empty arrays/objects if offline.
    }

    protected JSONArray ensureInit(JSONArray json) {
      if(json == null && dataset.isEmpty()) {
        Toast.makeText(context, "Failed to access Keyman server!", Toast.LENGTH_SHORT).show();
        failure.run();
        return null;
      }

      return (json != null) ? json : new JSONArray();
    }

    protected JSONObject ensureInit(JSONObject json) {
      if(json == null && dataset.isEmpty()) {
        Toast.makeText(context, "Failed to access Keyman server!", Toast.LENGTH_SHORT).show();
        failure.run();
        return null;
      }

      return (json != null) ? json : new JSONObject();
    }

    @Override
    protected void onPostExecute(CloudDownloadReturns jsonTuple) {
      // First things first - we've successfully downloaded from the Cloud.  Cache that stuff!
      if(jsonTuple.keyboardJSON != null) {
        saveJSONObjectToCache(getKeyboardCacheFile(context), jsonTuple.keyboardJSON);
      }
      if(jsonTuple.lexicalModelJSON != null) {
        saveJSONArrayToCache(getLexicalModelCacheFile(context), jsonTuple.lexicalModelJSON);
      }

      if (progressDialog != null && progressDialog.isShowing()) {
        try {
          progressDialog.dismiss();
          progressDialog = null;
        } catch (Exception e) {
          progressDialog = null;
        }
      }

      jsonTuple.keyboardJSON = ensureInit(jsonTuple.keyboardJSON);
      jsonTuple.lexicalModelJSON = ensureInit(jsonTuple.lexicalModelJSON);

      processCloudReturns(jsonTuple, true);
    }

    public Bundle updateCheck(LanguageResource cloudResource, LanguageResource existingMatch) {
      if(DEBUG_SIMULATE_UPDATES) {
        return cloudResource.buildDownloadBundle();
      }

      if (compareVersions(cloudResource, existingMatch) == FileUtils.VERSION_GREATER) {
        return cloudResource.buildDownloadBundle();
      } else {
        return null;
      }
    }

    public int compareVersions(LanguageResource addition, LanguageResource original) {
      // Get version from newly-downloaded keyboard.
      String addVersion = addition.getVersion();
      String origVersion = original.getVersion();

      int result = FileUtils.compareVersions(addVersion, origVersion);

      if(DEBUG_SIMULATE_UPDATES && result == FileUtils.VERSION_EQUAL) {
        // Ensures that we preserve the cloud-based version that provides download URLs.
        return FileUtils.VERSION_GREATER;
      } else {
        return result;
      }
    }

    public void processCloudReturns(CloudDownloadReturns jsonTuple, boolean executeCallbacks) {
      // Only empty if no queries returned data - we're offline.
      if(jsonTuple.isEmpty()) {
        if(this.updateHandler == null) {
          String msg = context.getString(R.string.catalog_unavailable);
          Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
        }
        this.failure.run(); // Signal failure to download to our failure callback.
        return;
      }

      List<Keyboard> keyboardsArrayList = processKeyboardJSON(jsonTuple.keyboardJSON, false);
      List<LexicalModel> lexicalModelsArrayList = processLexicalModelJSON(jsonTuple.lexicalModelJSON);

      Dataset installedData = KeyboardPickerActivity.getInstalledDataset(context);
      final List<Bundle> updateBundles = new ArrayList<>();

      // We're about to do a big batch of edits.
      this.dataset.setNotifyOnChange(false);

      // Filter out any duplicates from KMP keyboards, properly merging the lists.
      for(int i = 0; i < keyboardsArrayList.size(); i++) {
        Keyboard keyboard = keyboardsArrayList.get(i);

        // Check for duplicates / possible updates.
        Keyboard match = dataset.keyboards.findMatch(keyboard);

        if(match != null) {
          if(compareVersions(keyboard, match) == FileUtils.VERSION_GREATER) {
            dataset.keyboards.remove(match);
          } else {
            keyboardsArrayList.remove(keyboard);
            i--; // Decrement our index to reflect the removal.
          }
        } // else no match == no special handling.
      }

      // Add cloud-returned keyboard info to the CloudRepository's KeyboardsAdapter.
      dataset.keyboards.addAll(keyboardsArrayList);

      // The actual update check.
      for(int i = 0; i < installedData.keyboards.getCount(); i++) {
        Keyboard keyboard = installedData.keyboards.getItem(i);

        // Check for duplicates / possible updates.
        Keyboard match = dataset.keyboards.findMatch(keyboard);

        if(match != null) {
          Bundle bundle = updateCheck(match, keyboard);
          if(bundle != null) {
            updateBundles.add(bundle);
          }
        } // else no match == no special handling.
      }

      // Filter out any duplicates from already-installed models, properly merging the lists.
      for(int i = 0; i < lexicalModelsArrayList.size(); i++) {
        LexicalModel model = lexicalModelsArrayList.get(i);

        // Check for duplicates / possible updates.
        LexicalModel match = dataset.lexicalModels.findMatch(model);

        if(match != null) {
          if (compareVersions(model, match) == FileUtils.VERSION_GREATER) {
            dataset.lexicalModels.remove(match);
          } else {
            lexicalModelsArrayList.remove(model);
            i--; // Decrement our index to reflect the removal.
          }
        } // else no match == no special handling.
      }

      // Add the cloud-returned lexical model info to the CloudRepository's lexical models adapter.
      dataset.lexicalModels.addAll(lexicalModelsArrayList);

      // Do the actual update checks.
      for(int i = 0; i < installedData.lexicalModels.getCount(); i++) {
        LexicalModel model = installedData.lexicalModels.getItem(i);

        // Check for duplicates / possible updates.
        LexicalModel match = dataset.lexicalModels.findMatch(model);

        if(match != null) {
          Bundle bundle = updateCheck(match, model);
          if(bundle != null) {
            updateBundles.add(bundle);
          }
        } // else no match == no special handling.
      }

      if(updateBundles.size() > 0) {
        // Time for updates!
        Log.v(TAG, "Performing keyboard and model updates for " + updateBundles.size() + " resources.");

        updateHandler.onUpdateDetection(updateBundles);
      }

      // And finish.
      this.dataset.notifyDataSetChanged(); // Edits are done - signal that.

      if(executeCallbacks) {
        querySuccess.run();
      }
    }
  }
}
